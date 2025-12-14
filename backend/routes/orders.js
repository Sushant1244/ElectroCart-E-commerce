const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderTracking } = require('../controllers/orderController');

router.post('/', authMiddleware, createOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/track/:id', authMiddleware, getOrderTracking);

// admin
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.patch('/:id', authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;