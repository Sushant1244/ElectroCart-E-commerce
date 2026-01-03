const adapter = require('../models/adapter');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total, paymentMethod } = req.body;

    // Require authenticated user
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    // coerce user id from different shapes (adapter may use id or _id)
    let userId = req.user._id ?? req.user.id ?? null;
    if (typeof userId === 'string' && /^\d+$/.test(userId)) userId = Number(userId);

    // Basic payload validation
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Order items required' });

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