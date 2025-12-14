const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    price: Number
  }],
  shippingAddress: { type: Object },
  total: { type: Number },
  paid: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  trackingNumber: { type: String, default: '' },
  deliveryStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryUpdates: [{
    status: String,
    location: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);