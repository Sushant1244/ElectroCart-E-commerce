const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderTracking, cancelOrder } = require('../controllers/orderController');

router.post('/', authMiddleware, createOrder);
router.get('/my', authMiddleware, getMyOrders);
router.get('/track/:id', authMiddleware, getOrderTracking);

// admin
router.get('/', authMiddleware, adminMiddleware, getAllOrders);
router.patch('/:id', authMiddleware, adminMiddleware, updateOrderStatus);
// allow user to cancel their own order
router.patch('/:id/cancel', authMiddleware, cancelOrder);

module.exports = router;