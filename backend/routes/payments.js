// Khalti integration endpoints. Configure KHALTI_SECRET_KEY in backend env for live or dev testing.
// Use POST /api/payments/khati/initiate with the payload shown in the project README or the request in the user's message.
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
router.post('/khati/initiate', async (req, res) => {
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
router.post('/khati/status', async (req, res) => {
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
router.post('/khati/callback', async (req, res) => {
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
router.post('/khati/verify', async (req, res) => {
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
router.post('/khati/debug-verify', async (req, res) => {
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

module.exports = router;

// Expose public config for frontend clients (safe to expose public key)
router.get('/khati/config', (req, res) => {
  try {
    const publicKey = process.env.KHALTI_LIVE_PUBLIC_KEY || process.env.KHALTI_PUBLIC_KEY || process.env.KHALTI_LIVE_PUBLIC_KEY || null;
    return res.json({ publicKey, env: KHALTI_ENV });
  } catch (e) {
    return res.status(500).json({ message: 'failed to read khalti config' });
  }
});


