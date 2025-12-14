const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { getSalesStats } = require('../controllers/analyticsController');

router.get('/', authMiddleware, adminMiddleware, getSalesStats);

module.exports = router;

