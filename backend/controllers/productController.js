const adapter = require('../models/adapter');
const fs = require('fs');
const path = require('path');
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
    // use countInStock for PG model while keeping 'stock' in response via adapter
    countInStock: Number(stock) || 0,
      images,
      slug,
      featured: featured === 'true' || featured === true,
      rating: rating ? Number(rating) : 5
    };
    
  const product = await adapter.Product.create(productData);
  // adapter will normalize and include 'stock' property for frontend
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
    const update = { ...req.body };

    // parse numeric fields
    if (update.price) update.price = Number(update.price);
    if (update.originalPrice) update.originalPrice = Number(update.originalPrice);
    if (update.stock) update.stock = Number(update.stock);
    if (update.rating) update.rating = Number(update.rating);
    if (update.featured !== undefined) update.featured = update.featured === 'true' || update.featured === true;

    const existingProduct = await adapter.Product.findById(id);
    const replaceFlag = req.body && (req.body.replaceImages === 'true' || req.body.replaceImages === true || req.body.replaceImages === '1');

    // helper: parse incoming array/string -> array
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try { const parsed = JSON.parse(val); if (Array.isArray(parsed)) return parsed; return [val]; } catch (e) { return val.split(',').map(s => s.trim()).filter(Boolean); }
      }
      return [];
    };

    let baseImages = existingProduct && Array.isArray(existingProduct.images) ? existingProduct.images.slice() : [];

    // handle deleteImages: remove from baseImages and delete files
    const delImages = parseArray(req.body && req.body.deleteImages);
    if (delImages.length) {
      const toFilename = (img) => img ? (img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img) : '';
      const delFilenames = delImages.map(toFilename);
      for (const img of delImages) {
        try {
          // remove matching filenames from baseImages
          baseImages = baseImages.filter(i => {
            const f = toFilename(i);
            return !delFilenames.includes(f);
          });
          const filename = toFilename(img);
          const filePath = path.join(__dirname, '..', 'uploads', filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.debug('Deleted upload file:', filePath);
          }
        } catch (err) {
          console.warn('Failed to remove old upload file during deleteImages', err && err.message ? err.message : err);
        }
      }
      // ensure DB is updated if deletions happened and no other image changes
      if (!req.files?.length && !req.body.images) {
        update.images = baseImages;
        if (update.stock !== undefined && update.countInStock === undefined) {
          update.countInStock = Number(update.stock);
          delete update.stock;
        }
        const product = await adapter.Product.findByIdAndUpdate(id, update);
        return res.json(product);
      }
    }

    // handle new uploaded files
    if (req.files?.length) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      if (replaceFlag) {
        // remove any remaining baseImages files
        for (const img of baseImages) {
          try {
            if (!img) continue;
            const filename = img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img;
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) { console.warn('Failed to remove old upload file', err && err.message ? err.message : err); }
        }
        update.images = newImages;
      } else {
        update.images = [...baseImages, ...newImages];
      }
    } else if (req.body.images) {
      const bodyImages = parseArray(req.body.images);
      if (replaceFlag) {
        for (const img of baseImages) {
          try {
            if (!img) continue;
            const filename = img.startsWith('/uploads/') ? img.replace('/uploads/', '') : img;
            const filePath = path.join(__dirname, '..', 'uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) { console.warn('Failed to remove old upload file', err && err.message ? err.message : err); }
        }
        update.images = bodyImages;
      } else {
        update.images = [...baseImages, ...bodyImages];
      }
    }

    // If the frontend sent 'stock', map it to countInStock for DB
    if (update.stock !== undefined && update.countInStock === undefined) {
      update.countInStock = Number(update.stock);
      delete update.stock;
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