const adapter = require('../models/adapter');
const fs = require('fs');
const path = require('path');

function auditAdminOrderAttempt(info) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const logFile = path.join(logsDir, 'admin-order-attempts.log');
    const line = `[${new Date().toISOString()}] ${JSON.stringify(info)}\n`;
    fs.appendFileSync(logFile, line);
  } catch (e) {
    console.error('Failed to write audit log', e);
  }
}

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total, paymentMethod, userId: bodyUserId } = req.body;

    // Require authenticated user
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // Basic payload validation
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Order items required' });

    // Ensure shipping address is present and looks valid (frontend saves fullName/line1/city/country)
    if (!shippingAddress || !(shippingAddress.fullName || shippingAddress.name) || !(shippingAddress.line1 || shippingAddress.address)) {
      return res.status(400).json({ message: 'Valid shippingAddress required' });
    }

    // coerce user id from different shapes (adapter may use id or _id)
    // Admins should not place orders for themselves. If an admin is creating an order
    // it must be explicitly for another user via `userId` in the payload.
    if (req.user?.isAdmin && !bodyUserId) {
      // audit and block
      auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'blocked_create_order_no_userId', payload: { items: items?.length || 0, total } });
      return res.status(403).json({ message: 'Admin users cannot place orders. To create an order on behalf of a user, provide a userId.' });
    }

    // Allow admins to create an order for another user by passing `userId` in the payload
    let userId = null;
    if (req.user?.isAdmin && bodyUserId) {
      // prevent admin accidentally creating an order for themselves by passing their own id
      if (String(bodyUserId) === String(req.user._id ?? req.user.id)) {
        auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'blocked_create_order_self_userId', payload: { userId: bodyUserId } });
        return res.status(400).json({ message: 'Invalid userId: cannot create an order for the admin user.' });
      }
      userId = bodyUserId;
    } else {
      userId = req.user._id ?? req.user.id ?? null;
    }
    if (typeof userId === 'string' && /^\d+$/.test(userId)) userId = Number(userId);

    // Determine paid status: COD remains unpaid until delivery (false), online methods marked paid for demo
    const paid = paymentMethod && String(paymentMethod).toLowerCase() !== 'cod';

    const nowIso = new Date().toISOString();
    const orderData = {
      userId,
      orderItems: items,
      shippingAddress: shippingAddress || null,
      totalPrice: total || 0,
      paymentMethod: paymentMethod || 'cod',
      isPaid: !!paid,
      status: 'processing',
      deliveryStatus: 'pending',
      paymentResult: paid ? { provider: paymentMethod, paidAt: nowIso } : null,
      // use a consistent `timestamp` (ISO string) so frontend can render updates reliably
      deliveryUpdates: [{ status: 'pending', location: 'Order Received', note: 'Order has been received and is being processed', timestamp: nowIso }]
    };

    const order = await adapter.Order.create(orderData);
    if (req.user?.isAdmin) {
      auditAdminOrderAttempt({ user: { id: req.user._id ?? req.user.id, email: req.user.email }, action: 'created_order_on_behalf', createdOrderId: order && (order._id || order.id || null), payload: { userId, total: orderData.totalPrice } });
    }
    return res.status(201).json(order);
  } catch (e) {
    try { console.error('createOrder error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    // coerce numeric ids to number when possible to match PG schema
    const qUserId = typeof userId === 'string' && /\d+/.test(userId) ? Number(userId) : userId;
    const orders = await adapter.Order.find({ userId: qUserId });
    res.json(orders);
  } catch (e) {
    try { console.error('getMyOrders error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
  const orders = await adapter.Order.findAll();
  res.json(orders);
  } catch (e) {
    try { console.error('getAllOrders error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log error', error_); }
    res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryStatus, trackingNumber, note, location } = req.body;
    const id = req.params.id;

    // Load existing order
    const order = await adapter.Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Build updates
    const updates = {};
    if (status) updates.status = status;
    if (deliveryStatus) updates.deliveryStatus = deliveryStatus;
    if (trackingNumber) updates.trackingNumber = trackingNumber;

    // Append a delivery update entry to the existing array
    const existing = Array.isArray(order.deliveryUpdates) ? order.deliveryUpdates.slice() : [];
    if (deliveryStatus || note || location) {
      const entry = {
        status: deliveryStatus || status,
        location: location || 'Warehouse',
        note: note || `${deliveryStatus || status} update`,
        // provide `timestamp` for frontend consistency (fallbacks handled on client)
        timestamp: new Date()
      };
      existing.push(entry);
    }
    updates.deliveryUpdates = existing;

    const updated = await adapter.Order.findByIdAndUpdate(id, updates);
    return res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
  const order = await adapter.Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // If user is not admin, verify they own the order
  if (!req.user?.isAdmin && order.userId && req.user?._id && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};