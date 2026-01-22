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
// list reviews for a product
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const productController = require('../controllers/productController');
    if (typeof productController.listReviews === 'function') return productController.listReviews(req, res, next);
    return res.status(501).json({ message: 'Not implemented' });
  } catch (e) { return next(e); }
});

router.post('/:id/reviews', authMiddleware, async (req, res, next) => {
  try {
    const productController = require('../controllers/productController');
    if (typeof productController.addReview === 'function') return productController.addReview(req, res, next);
    return res.status(501).json({ message: 'Not implemented' });
  } catch (e) { return next(e); }
});

// admin protected
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 6), createProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 6), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;