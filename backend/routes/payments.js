// Khalti integration endpoints. Configure KHALTI_SECRET_KEY in backend env for live or dev testing.
// Use POST /api/payments/khalti/initiate with the payload shown in the project README or the request in the user's message.
const express = require('express');
const https = require('https');
const { URL } = require('url');
const axios = require('axios');
const qs = require('querystring');
const router = express.Router();

const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY || process.env.KHALTI_LIVE_KEY || null;
const KHALTI_ENV = process.env.KHALTI_ENV === 'production' ? 'production' : 'dev';

const KHALTI_INITIATE_URL = KHALTI_ENV === 'production' ? 'https://khalti.com/api/v2/epayment/initiate/' : 'https://dev.khalti.com/api/v2/epayment/initiate/';
const KHALTI_VERIFY_URL = KHALTI_ENV === 'production' ? 'https://khalti.com/api/v2/payment/verify/' : 'https://dev.khalti.com/api/v2/payment/verify/';

// In-memory mapping of pidx -> { orderId, amount } for development convenience.
const pendingPayments = new Map();

// Helper that tries JSON POST via axios, and falls back to form-urlencoded if Khalti returns 401
async function postToKhalti(url, headers = {}, bodyObj = {}) {
  try {
    const opts = { headers: Object.assign({ 'Content-Type': 'application/json' }, headers), timeout: 10000 };
    const resp = await axios.post(url, bodyObj, opts);
    return { status: resp.status, body: resp.data };
  } catch (e) {
    const status = e.response?.status || null;
    const data = e.response?.data || null;
    // if unauthorized or unexpected, try as form-url-encoded (some Khalti endpoints accept this)
    if (status === 401 || status === 400) {
      try {
        const form = qs.stringify(bodyObj || {});
        const opts2 = { headers: Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, headers), timeout: 10000 };
        const resp2 = await axios.post(url, form, opts2);
        return { status: resp2.status, body: resp2.data };
      } catch (e2) {
        return { status: e2.response?.status || status || 500, body: e2.response?.data || (e2.message || e) };
      }
    }
    return { status: status || 500, body: data || (e.message || e) };
  }
}

// Initiate a Khalti payment session. Expects body as per Khalti API.
router.post('/khalti/initiate', async (req, res) => {
  try {
    if (!KHALTI_SECRET) return res.status(500).json({ message: 'KHALTI_SECRET_KEY not configured on server' });
    const payload = req.body || {};
    // minimal validation
    if (!payload.return_url || !payload.website_url || !payload.amount || !payload.purchase_order_id) {
      return res.status(400).json({ message: 'Missing required fields (return_url, website_url, amount, purchase_order_id)' });
    }

    const headers = {
      'Authorization': `Key ${KHALTI_SECRET}`
    };

  const result = await postToKhalti(KHALTI_INITIATE_URL, headers, payload);
    // If Khalti returns an error (non-2xx), log the response body for debugging
    try {
      if (!result || (result.status && result.status >= 400)) {
        console.error('Khalti initiate returned non-2xx', { status: result?.status, body: result?.body });
      }
    } catch (logErr) {
      console.error('Failed to log Khalti initiate result', logErr && logErr.message ? logErr.message : logErr);
    }
    // try to persist the returned pidx into the Order record so callbacks can be matched reliably
    try {
      const resp = result.body || {};
      const pidx = resp.pidx || resp.data?.pidx || null;
      if (pidx && payload.purchase_order_id) {
        // try adapter update first (if Postgres/Sequelize present)
        try {
          const adapter = require('../models/adapter');
          if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
            await adapter.Order.findByIdAndUpdate(payload.purchase_order_id, { paymentSession: { provider: 'khalti', pidx, initiatedAt: new Date(), amount: payload.amount } });
          }
        } catch (e) {
          // best-effort: also store in memory as a fallback
          pendingPayments.set(String(pidx), { orderId: payload.purchase_order_id, amount: payload.amount, createdAt: Date.now() });
        }
      }
    } catch (e) { /* ignore store failures */ }
    // forward Khalti response
    return res.status(result.status || 200).json(result.body);
  } catch (e) {
    console.error('Khalti initiate failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: e && e.message ? e.message : 'Khalti initiate failed' });
  }
});

// Simple helper to fetch payment status from Khalti if needed.
// Khalti may provide different endpoints for status; this attempts to call a common status endpoint if provided.
router.post('/khalti/status', async (req, res) => {
  try {
    if (!KHALTI_SECRET) return res.status(500).json({ message: 'KHALTI_SECRET_KEY not configured on server' });
    const { pidx } = req.body || {};
    if (!pidx) return res.status(400).json({ message: 'pidx is required' });

    // Khalti does not document a single status endpoint consistently; some setups allow GET on /epayment/status/<pidx>/
    const statusUrl = KHALTI_ENV === 'production' ? `https://khalti.com/api/v2/epayment/status/${encodeURIComponent(pidx)}/` : `https://dev.khalti.com/api/v2/epayment/status/${encodeURIComponent(pidx)}/`;
    const headers = { 'Authorization': `Key ${KHALTI_SECRET}` };
    // Perform a POST with empty body per some Khalti APIs (or GET if preferred). We'll use POST with pidx for compatibility.
  const result = await postToKhalti(statusUrl, headers, { pidx });
    return res.status(result.status || 200).json(result.body);
  } catch (e) {
    console.error('Khalti status fetch failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: e && e.message ? e.message : 'Khalti status fetch failed' });
  }
});

// Khalti callback/webhook endpoint (developer should secure and verify payload/signature)
// Khalti may POST to this URL with payment updates; we accept pidx and status and update the order accordingly.
// NOTE (dev): For production you must verify the callback signature and persist the provider session
// (pidx) and provider response in the Order row so restarts / multi-instance servers can reconcile.
router.post('/khalti/callback', async (req, res) => {
  try {
    const body = req.body || {};
    const pidx = body.pidx || body.data?.pidx || null;
    const status = body.status || body.data?.status || null;
    const transaction_id = body.transaction_id || body.data?.transaction_id || null;
    if (!pidx) return res.status(400).json({ message: 'pidx required' });
    // First try to find order by paymentSession JSONB match via adapter
    let orderId = null;
    try {
      const adapter = require('../models/adapter');
      if (adapter && adapter.Order && typeof adapter.Order.find === 'function') {
        // Sequelize should be able to match JSONB containment when passed an object like { paymentSession: { pidx: '...' } }
        const matches = await adapter.Order.find({ paymentSession: { pidx: String(pidx) } });
        if (Array.isArray(matches) && matches.length > 0) {
          orderId = matches[0]._id || matches[0].id || null;
        }
      }
    } catch (e) {
      console.warn('Order lookup by paymentSession failed', e && e.message ? e.message : e);
    }

    // Fallback to in-memory map if no order found
    if (!orderId) {
      const entry = pendingPayments.get(String(pidx));
      if (!entry) return res.status(404).json({ message: 'Unknown pidx' });
      orderId = entry.orderId;
    }

    // Update the order status using adapter if available
    try {
      const adapter = require('../models/adapter');
      if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
        const update = { paymentResult: { pidx, status, transaction_id }, isPaid: (String(status).toLowerCase() === 'completed' || String(status).toLowerCase() === 'success'), paidAt: new Date() };
        await adapter.Order.findByIdAndUpdate(orderId, update);
      }
    } catch (e) { console.warn('Failed to update order for pidx callback', e && e.message ? e.message : e); }
    // Remove pending mapping if present
    pendingPayments.delete(String(pidx));
    return res.json({ ok: true });
  } catch (e) {
    console.error('Khalti callback handler failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'callback handler failed' });
  }
});

// Verify a client-side token (for client-widget flow). Expects { token, amount, purchase_order_id }
router.post('/khalti/verify', async (req, res) => {
  try {
    if (!KHALTI_SECRET) return res.status(500).json({ message: 'KHALTI_SECRET_KEY not configured on server' });
    const { token, amount, purchase_order_id } = req.body || {};
    if (!token || !amount || !purchase_order_id) return res.status(400).json({ message: 'token, amount and purchase_order_id are required' });

    const headers = { 'Authorization': `Key ${KHALTI_SECRET}` };
    const payload = { token, amount };
    const result = await postToKhalti(KHALTI_VERIFY_URL, headers, payload);
    if (!result || (result.status && result.status >= 400)) {
      console.error('Khalti verify returned non-2xx', result && result.body);
      return res.status(result.status || 500).json(result.body || { message: 'Verification failed' });
    }

    // On successful verification, mark order as paid
    try {
      const adapter = require('../models/adapter');
      if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
        await adapter.Order.findByIdAndUpdate(purchase_order_id, { isPaid: true, paidAt: new Date(), paymentResult: result.body });
      }
    } catch (e) { console.error('Failed to update order after verify', e && e.message ? e.message : e); }

    return res.status(200).json(result.body);
  } catch (e) {
    console.error('Khalti verify failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: e && e.message ? e.message : 'Khalti verify failed' });
  }
});

// Dev helper: debug-verify returns raw Khalti response and logs it for troubleshooting.
// Do NOT enable this in production without access controls.
router.post('/khalti/debug-verify', async (req, res) => {
  try {
    if (!KHALTI_SECRET) return res.status(500).json({ message: 'KHALTI_SECRET_KEY not configured on server' });
    const { token, amount, purchase_order_id } = req.body || {};
    if (!token || !amount) return res.status(400).json({ message: 'token and amount are required' });

    const headers = { 'Authorization': `Key ${KHALTI_SECRET}` };
    const payload = { token, amount };
    // Call Khalti and return whatever it returns for debugging
    const result = await postToKhalti(KHALTI_VERIFY_URL, headers, payload);
    console.log('[khalti debug-verify] status=', result.status, 'body=', result.body);
    return res.status(result.status || 200).json({ status: result.status, body: result.body });
  } catch (e) {
    console.error('khalti debug-verify failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'khalti debug-verify failed', detail: e && e.message ? e.message : e });
  }
});

// Expose public config for frontend clients (safe to expose public key)
router.get('/khalti/config', (req, res) => {
  try {
    const publicKey = process.env.KHALTI_LIVE_PUBLIC_KEY || process.env.KHALTI_PUBLIC_KEY || process.env.KHALTI_LIVE_PUBLIC_KEY || null;
    return res.json({ publicKey, env: KHALTI_ENV });
  } catch (e) {
    return res.status(500).json({ message: 'failed to read khalti config' });
  }
});

module.exports = router;

// eSewa verification endpoint
// Expects { token, amount, orderId } in body. If ESEWA_SECRET or ESEWA_VERIFY_URL
// are set in env, the server will call the real eSewa API. In development, if not
// configured, returns a mocked success for convenience.
router.post('/esewa/verify', async (req, res) => {
  try {
    const { token, amount, orderId } = req.body || {};
    if (!token || !amount || !orderId) return res.status(400).json({ message: 'token, amount and orderId are required' });

    const ESEWA_VERIFY_URL = process.env.ESEWA_VERIFY_URL || null;
    const ESEWA_SECRET = process.env.ESEWA_SECRET || null;
    if (!ESEWA_VERIFY_URL || !ESEWA_SECRET) {
      // Dev fallback: accept any token when not configured
      console.log('[esewa] dev-verify: no ESEWA_VERIFY_URL configured — accepting token in dev');
      try {
        const adapter = require('../models/adapter');
        if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
          await adapter.Order.findByIdAndUpdate(orderId, { isPaid: true, paidAt: new Date(), paymentResult: { provider: 'esewa', token, amount } });
        }
      } catch (e) { console.warn('[esewa] failed to update order in dev-verify', e && e.message ? e.message : e); }
      return res.json({ ok: true, provider: 'esewa', debug: true });
    }

    // Call real eSewa verify endpoint (provider-specific). We'll POST JSON by default.
    try {
      const resp = await axios.post(ESEWA_VERIFY_URL, { token, amount, secret: ESEWA_SECRET }, { timeout: 10000 });
      if (!resp || resp.status >= 400) return res.status(resp?.status || 502).json({ message: 'eSewa verification failed', body: resp?.data });
      // update order
      try {
        const adapter = require('../models/adapter');
        if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
          await adapter.Order.findByIdAndUpdate(orderId, { isPaid: true, paidAt: new Date(), paymentResult: { provider: 'esewa', token, amount, raw: resp.data } });
        }
      } catch (e) { console.warn('[esewa] failed to update order after verify', e && e.message ? e.message : e); }
      return res.json({ ok: true, body: resp.data });
    } catch (e) {
      console.error('eSewa verify failed', e && (e.response?.data || e.message || e));
      return res.status(500).json({ message: 'eSewa verify failed', detail: e && (e.response?.data || e.message || e) });
    }
  } catch (e) {
    console.error('eSewa verify handler failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'eSewa verify handler failed' });
  }
});

// Bank transfer webhook — provider should POST { orderId, status, details }
router.post('/bank/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const orderId = body.orderId || body.order_id || body.reference || null;
    const status = (body.status || '').toString().toLowerCase() || null;
    if (!orderId) return res.status(400).json({ message: 'orderId required' });

    // Interpret status values like 'confirmed','paid','success' as successful
    const paid = ['paid', 'confirmed', 'success'].includes(status);
    try {
      const adapter = require('../models/adapter');
      if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
        await adapter.Order.findByIdAndUpdate(orderId, { isPaid: paid, paidAt: paid ? new Date() : null, paymentResult: { provider: 'bank', status: body.status || body.state || null, details: body } });
      }
    } catch (e) { console.warn('bank webhook: failed to update order', e && e.message ? e.message : e); }
    return res.json({ ok: true });
  } catch (e) {
    console.error('bank webhook handler failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'bank webhook handler failed' });
  }
});

// Dev helper: initiate a fake bank transfer. This returns bank instructions and a
// unique reference. In production you would redirect users to bank payment rails
// or show real banking instructions. This endpoint is intentionally simple and
// suitable for local development/testing.
router.post('/bank/initiate', async (req, res) => {
  try {
    const { purchase_order_id, amount } = req.body || {};
    if (!purchase_order_id || !amount) return res.status(400).json({ message: 'purchase_order_id and amount are required' });

    // Create a simple reference id
    const ref = `BANK-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
    // Store in pendingPayments map so webhook/confirm can find it
    pendingPayments.set(String(ref), { orderId: purchase_order_id, amount, createdAt: Date.now(), provider: 'bank' });

    // Return human-friendly bank instructions (dev-only values)
    return res.json({
      ok: true,
      provider: 'bank',
      instructions: {
        accountName: 'ElectroCart Dev Account',
        accountNumber: '000123456789',
        bankName: 'Dev Bank',
        iban: 'DEV00 0000 0000 0000 0000',
        reference: ref,
        amount,
        note: 'Use the reference exactly so the payment can be matched to your order.'
      }
    });
  } catch (e) {
    console.error('bank initiate failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'bank initiate failed' });
  }
});

// Dev helper: confirm a fake bank transfer (simulate provider callback). Accepts
// { reference } or { purchase_order_id } and marks the order paid.
router.post('/bank/confirm', async (req, res) => {
  try {
    const { reference, purchase_order_id, status } = req.body || {};
    const ref = reference || null;
    let entry = null;
    if (ref) entry = pendingPayments.get(String(ref));
    if (!entry && purchase_order_id) {
      // try to find by order id
      for (const [k, v] of pendingPayments.entries()) {
        if (String(v.orderId) === String(purchase_order_id)) { entry = v; break; }
      }
    }
    if (!entry && !purchase_order_id) return res.status(400).json({ message: 'reference or purchase_order_id required' });

    const orderId = entry ? entry.orderId : purchase_order_id;
    const paid = (String(status || 'paid').toLowerCase() === 'paid' || String(status || 'confirmed').toLowerCase() === 'confirmed');

    try {
      const adapter = require('../models/adapter');
      if (adapter && adapter.Order && typeof adapter.Order.findByIdAndUpdate === 'function') {
        await adapter.Order.findByIdAndUpdate(orderId, { isPaid: paid, paidAt: paid ? new Date() : null, paymentResult: { provider: 'bank', reference: ref || null, status: status || 'paid' } });
      }
    } catch (e) { console.warn('bank confirm: failed to update order', e && e.message ? e.message : e); }

    // remove pending mapping if present
    if (ref) pendingPayments.delete(String(ref));

    return res.json({ ok: true, orderId, paid });
  } catch (e) {
    console.error('bank confirm failed', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'bank confirm failed' });
  }
});



// ============================================
// Payment Methods (Saved Cards) API
// ============================================

const { authMiddleware } = require('../middleware/auth');

// Get all saved payment methods for the authenticated user
router.get('/methods', authMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    if (!adapter.PaymentMethod) {
      return res.status(503).json({ message: 'Payment methods not available' });
    }
    const methods = await adapter.PaymentMethod.find({ userId: req.user.id });
    // Return methods with masked card numbers (only last 4 digits visible)
    const maskedMethods = methods.map(m => ({
      _id: m._id,
      id: m.id,
      cardType: m.cardType,
      cardNumberLast4: m.cardNumberLast4,
      cardholderName: m.cardholderName,
      expiryDate: m.expiryDate,
      cardBrand: m.cardBrand,
      isDefault: m.isDefault,
      nickname: m.nickname,
      createdAt: m.createdAt
    }));
    return res.json(maskedMethods);
  } catch (e) {
    console.error('Failed to get payment methods', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'Failed to get payment methods' });
  }
});

// Add a new payment method (save card)
router.post('/methods', authMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    if (!adapter.PaymentMethod) {
      return res.status(503).json({ message: 'Payment methods not available' });
    }
    const { cardType, cardNumber, cardholderName, expiryDate, cvv, cardBrand, nickname, isDefault } = req.body || {};
    
    // Validate required fields
    if (!cardNumber || !cardholderName || !expiryDate || !cvv) {
      return res.status(400).json({ message: 'Card number, cardholder name, expiry date, and CVV are required' });
    }
    
    // Validate card number format (basic check)
    const cardNum = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNum)) {
      return res.status(400).json({ message: 'Invalid card number' });
    }
    
    // Validate expiry date format (MM/YY)
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      return res.status(400).json({ message: 'Invalid expiry date. Use MM/YY format' });
    }
    
    // Validate CVV format
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: 'Invalid CVV' });
    }
    
    // If this is set as default, unset other defaults first
    if (isDefault) {
      const existingMethods = await adapter.PaymentMethod.find({ userId: req.user.id });
      for (const method of existingMethods) {
        if (method.isDefault) {
          await adapter.PaymentMethod.findByIdAndUpdate(method.id, { isDefault: false });
        }
      }
    }
    
    // Detect card brand from card number
    let brand = cardBrand;
    if (!brand) {
      if (cardNum.startsWith('4')) brand = 'Visa';
      else if (/^5[1-5]/.test(cardNum) || /^2[2-7]/.test(cardNum)) brand = 'Mastercard';
      else if (/^3[47]/.test(cardNum)) brand = 'American Express';
      else if (/^6(?:011|5)/.test(cardNum)) brand = 'Discover';
      else brand = 'Other';
    }
    
    // Store the payment method
    const paymentMethod = await adapter.PaymentMethod.create({
      userId: req.user.id,
      cardType: cardType || 'debit',
      cardNumberLast4: cardNum.slice(-4),
      cardNumber: cardNum,
      cardholderName,
      expiryDate,
      cvv: cvv,
      cardBrand: brand,
      nickname: nickname || `${brand} •••• ${cardNum.slice(-4)}`,
      isDefault: isDefault || false
    });
    
    // Return masked card info (don't return full card number)
    return res.status(201).json({
      _id: paymentMethod._id,
      id: paymentMethod.id,
      cardType: paymentMethod.cardType,
      cardNumberLast4: paymentMethod.cardNumberLast4,
      cardholderName: paymentMethod.cardholderName,
      expiryDate: paymentMethod.expiryDate,
      cardBrand: paymentMethod.cardBrand,
      isDefault: paymentMethod.isDefault,
      nickname: paymentMethod.nickname,
      createdAt: paymentMethod.createdAt
    });
  } catch (e) {
    console.error('Failed to add payment method', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'Failed to add payment method' });
  }
});

// Update a payment method
router.put('/methods/:id', authMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    if (!adapter.PaymentMethod) {
      return res.status(503).json({ message: 'Payment methods not available' });
    }
    const { id } = req.params;
    const { cardType, cardholderName, expiryDate, cvv, nickname, isDefault } = req.body || {};
    
    // Find the payment method first
    const existing = await adapter.PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Verify ownership
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Build update object
    const updateData = {};
    if (cardType) updateData.cardType = cardType;
    if (cardholderName) updateData.cardholderName = cardholderName;
    if (expiryDate) {
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        return res.status(400).json({ message: 'Invalid expiry date. Use MM/YY format' });
      }
      updateData.expiryDate = expiryDate;
    }
    if (cvv) {
      if (!/^\d{3,4}$/.test(cvv)) {
        return res.status(400).json({ message: 'Invalid CVV' });
      }
      updateData.cvv = cvv;
    }
    if (nickname !== undefined) updateData.nickname = nickname;
    
    // If setting as default, unset other defaults first
    if (isDefault && !existing.isDefault) {
      const allMethods = await adapter.PaymentMethod.find({ userId: req.user.id });
      for (const method of allMethods) {
        if (method.isDefault && method.id !== parseInt(id)) {
          await adapter.PaymentMethod.findByIdAndUpdate(method.id, { isDefault: false });
        }
      }
      updateData.isDefault = true;
    }
    
    const updated = await adapter.PaymentMethod.findByIdAndUpdate(id, updateData);
    
    return res.json({
      _id: updated._id,
      id: updated.id,
      cardType: updated.cardType,
      cardNumberLast4: updated.cardNumberLast4,
      cardholderName: updated.cardholderName,
      expiryDate: updated.expiryDate,
      cardBrand: updated.cardBrand,
      isDefault: updated.isDefault,
      nickname: updated.nickname,
      createdAt: updated.createdAt
    });
  } catch (e) {
    console.error('Failed to update payment method', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'Failed to update payment method' });
  }
});

// Delete a payment method
router.delete('/methods/:id', authMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    if (!adapter.PaymentMethod) {
      return res.status(503).json({ message: 'Payment methods not available' });
    }
    const { id } = req.params;
    
    // Find the payment method first
    const existing = await adapter.PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Verify ownership
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await adapter.PaymentMethod.deleteById(id);
    
    return res.json({ ok: true, message: 'Payment method deleted' });
  } catch (e) {
    console.error('Failed to delete payment method', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'Failed to delete payment method' });
  }
});

// Set a payment method as default
router.post('/methods/:id/set-default', authMiddleware, async (req, res) => {
  try {
    const adapter = require('../models/adapter');
    if (!adapter.PaymentMethod) {
      return res.status(503).json({ message: 'Payment methods not available' });
    }
    const { id } = req.params;
    
    // Find the payment method first
    const existing = await adapter.PaymentMethod.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    
    // Verify ownership
    if (existing.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Unset all other defaults
    const allMethods = await adapter.PaymentMethod.find({ userId: req.user.id });
    for (const method of allMethods) {
      if (method.isDefault) {
        await adapter.PaymentMethod.findByIdAndUpdate(method.id, { isDefault: false });
      }
    }
    
    // Set this one as default
    const updated = await adapter.PaymentMethod.findByIdAndUpdate(id, { isDefault: true });
    
    return res.json({
      _id: updated._id,
      id: updated.id,
      cardType: updated.cardType,
      cardNumberLast4: updated.cardNumberLast4,
      cardholderName: updated.cardholderName,
      expiryDate: updated.expiryDate,
      cardBrand: updated.cardBrand,
      isDefault: updated.isDefault,
      nickname: updated.nickname,
      createdAt: updated.createdAt
    });
  } catch (e) {
    console.error('Failed to set default payment method', e && e.message ? e.message : e);
    return res.status(500).json({ message: 'Failed to set default payment method' });
  }
});
