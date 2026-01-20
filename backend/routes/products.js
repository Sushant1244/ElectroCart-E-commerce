const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  createProduct, updateProduct, deleteProduct, getProducts, getProductBySlug, getProductById
} = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_')); }
});
const upload = multer({ storage });

router.get('/', getProducts);
router.get('/by-id/:id', getProductById);
router.get('/:slug', getProductBySlug);

// allow authenticated users to post reviews/ratings for a product
router.post('/:id/reviews', authMiddleware, async (req, res, next) => {
  // delegate to controller function if present
  try {
    const { rating, comment } = req.body;
    // simple validation
    if (!rating) return res.status(400).json({ message: 'Rating is required' });
    // attach user to request (authMiddleware sets req.user)
    // call controller method (if exported)
    const productController = require('../controllers/productController');
    if (typeof productController.addReview === 'function') {
      return productController.addReview(req, res, next);
    }
    // fallback: update numeric rating on product directly via adapter
    const adapter = require('../models/adapter');
    const id = req.params.id;
    const prod = await adapter.Product.findById(id);
    if (!prod) return res.status(404).json({ message: 'Product not found' });
    const r = Number(rating);
    const newNum = (prod.numReviews || 0) + 1;
    const newRating = ((prod.rating || 0) * (prod.numReviews || 0) + r) / newNum;
    const updated = await adapter.Product.findByIdAndUpdate(id, { rating: newRating, numReviews: newNum });
    return res.json(updated);
  } catch (e) { return next(e); }
});

// admin protected
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 6), createProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 6), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;