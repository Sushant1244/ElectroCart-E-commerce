const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String },
  images: [String], // URLs or relative paths
  stock: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);