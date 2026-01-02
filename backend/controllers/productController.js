const adapter = require('../models/adapter');
const { listProducts: listInMemoryProducts, findBySlug: findInMemoryBySlug, findById: findInMemoryById } = require('../utils/inMemoryProducts');
const slugify = require('slugify');

exports.createProduct = async (req, res) => {
  try {
    // Debug: log incoming request metadata to help diagnose 500 errors
    try {
      console.debug('createProduct called', {
        bodyKeys: req.body ? Object.keys(req.body) : null,
        hasFiles: Array.isArray(req.files) ? req.files.length : 0,
        contentType: req.headers['content-type']
      });
    } catch (logErr) { console.debug('createProduct: failed to log request meta', logErr); }
    const { name, description, price, originalPrice, category, stock, featured, rating } = req.body;
    // Support two ways to provide images:
    // - uploading files (req.files) -> stored as /uploads/<filename>
    // - providing existing upload paths in JSON body as `images` (e.g. ['/uploads/Iphone.png'])
    let images = [];
    if (req.files?.length) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.body.images) {
      // images may be a JSON array or a single comma-separated string
      if (Array.isArray(req.body.images)) images = req.body.images;
      else if (typeof req.body.images === 'string') {
        try {
          const parsed = JSON.parse(req.body.images);
          if (Array.isArray(parsed)) images = parsed;
          else images = [req.body.images];
        } catch (e) {
          // not JSON - treat as comma separated
          images = req.body.images.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }
    const slug = slugify(name, { lower: true, strict: true });
  const existing = await adapter.Product.findOne({ slug });
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
    
  const product = await adapter.Product.create(productData);
  res.json(product);
  } catch (e) {
  // Log full error for diagnostics
  try { console.error('createProduct error:', e && e.stack ? e.stack : e); } catch (logErr) { console.error('Failed to log error', logErr); }
  // Respond with message when available, otherwise empty string (client already handles this)
  res.status(500).json({ message: e && e.message ? e.message : '' });
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
    
    // If new files are uploaded, convert to upload paths and append
    if (req.files?.length) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
  const existingProduct = await adapter.Product.findById(id);
      if (existingProduct && existingProduct.images) {
        update.images = [...existingProduct.images, ...newImages];
      } else {
        update.images = newImages;
      }
    } else if (req.body.images) {
      // If images are provided in body (JSON), append or set
      let bodyImages = [];
      if (Array.isArray(req.body.images)) bodyImages = req.body.images;
      else if (typeof req.body.images === 'string') {
        try { bodyImages = JSON.parse(req.body.images); if (!Array.isArray(bodyImages)) bodyImages = [bodyImages]; }
        catch (e) { bodyImages = req.body.images.split(',').map(s => s.trim()).filter(Boolean); }
      }
  const existingProduct = await adapter.Product.findById(id);
      if (existingProduct && existingProduct.images) update.images = [...existingProduct.images, ...bodyImages];
      else update.images = bodyImages;
    }
    
  const product = await adapter.Product.findByIdAndUpdate(id, update);
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
  await adapter.Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { featured, category } = req.query;
    // If DB is disconnected, return in-memory products for dev convenience
    // If using mongoose and disconnected, fallback to in-memory products
    if (!adapter.Product.find) {
      const products = listInMemoryProducts({ featured, category });
      return res.json(products);
    }
    const query = {};
    if (featured === 'true') query.featured = true;
    if (category) query.category = category;
  const products = await adapter.Product.find(query, { sort: { field: 'createdAt', dir: 'DESC' } });
  res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
  const product = await adapter.Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getProductBySlug = async (req, res) => {
  try {
  const product = await adapter.Product.findBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: 'Not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};