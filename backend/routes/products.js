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

// admin protected
router.post('/', authMiddleware, adminMiddleware, upload.array('images', 6), createProduct);
router.put('/:id', authMiddleware, adminMiddleware, upload.array('images', 6), updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;