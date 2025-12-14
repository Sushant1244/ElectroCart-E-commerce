const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, total } = req.body;
    // For demo purposes, mark as paid. In production, integrate with payment gateway
    const order = await Order.create({ 
      user: req.user._id, 
      items, 
      shippingAddress, 
      total, 
      paid: true, 
      status: 'processing',
      deliveryStatus: 'pending',
      deliveryUpdates: [{
        status: 'pending',
        location: 'Order Received',
        note: 'Order has been received and is being processed'
      }]
    });
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.product');
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
    
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('user').populate('items.product');
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // If user is not admin, verify they own the order
    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};