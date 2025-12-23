const adapter = require('../models/adapter');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total } = req.body;
    // For demo purposes, mark as paid. In production, integrate with payment gateway
    const orderData = {
      userId: req.user._id,
      orderItems: items,
      shippingAddress,
      totalPrice: total,
      isPaid: true,
      status: 'processing',
      deliveryStatus: 'pending',
      deliveryUpdates: [{ status: 'pending', location: 'Order Received', note: 'Order has been received and is being processed' }]
    };
    const order = await adapter.Order.create(orderData);
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
  const orders = await adapter.Order.find({ userId: req.user._id });
  res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
  const orders = await adapter.Order.findAll();
  res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryStatus, trackingNumber, note, location } = req.body;
    const update = { status };
    
    if (deliveryStatus) update.deliveryStatus = deliveryStatus;
    if (trackingNumber) update.trackingNumber = trackingNumber;
    
    // Add delivery update
    if (deliveryStatus || note || location) {
      const updateEntry = {
        status: deliveryStatus || status,
        location: location || 'Warehouse',
        note: note || `${deliveryStatus || status} update`
      };
      update.$push = { deliveryUpdates: updateEntry };
    }
    
  const order = await adapter.Order.findByIdAndUpdate(req.params.id, update);
  res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
  const order = await adapter.Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // If user is not admin, verify they own the order
  if (!req.user.isAdmin && order.userId && order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};