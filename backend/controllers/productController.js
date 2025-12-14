const Product = require('../models/Product');
const slugify = require('slugify');

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, stock, featured, rating } = req.body;
    const images = (req.files || []).map(f => `/uploads/${f.filename}`);
    const slug = slugify(name, { lower: true, strict: true });
    const existing = await Product.findOne({ slug });
    if (existing) return res.status(400).json({ message: 'Product with same slug exists' });
    
    const productData = {
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      stock: Number(stock) || 0,
      images,
      slug,
      featured: featured === 'true' || featured === true,
      rating: rating ? Number(rating) : 5
    };
    
    const product = await Product.create(productData);
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const update = {...req.body};
    
    // Handle price and stock as numbers
    if (update.price) update.price = Number(update.price);
    if (update.originalPrice) update.originalPrice = Number(update.originalPrice);
    if (update.stock) update.stock = Number(update.stock);
    if (update.rating) update.rating = Number(update.rating);
    if (update.featured !== undefined) update.featured = update.featured === 'true' || update.featured === true;
    
    // If new images are uploaded, append them to existing images
    if (req.files?.length) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      const existingProduct = await Product.findById(id);
      if (existingProduct && existingProduct.images) {
        update.images = [...existingProduct.images, ...newImages];
      } else {
        update.images = newImages;
      }
    }
    
    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { featured, category } = req.query;
    const query = {};
    if (featured === 'true') query.featured = true;
    if (category) query.category = category;
    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};