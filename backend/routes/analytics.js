const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getSalesStats } = require('../controllers/analyticsController');
const { getUserStats } = require('../controllers/analyticsController');

router.get('/', authMiddleware, adminMiddleware, getSalesStats);
router.get('/users', authMiddleware, adminMiddleware, getUserStats);

module.exports = router;

