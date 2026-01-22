const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { listNotifications, createNotification, markRead } = require('../controllers/notificationController');

router.get('/', authMiddleware, listNotifications);
router.post('/', authMiddleware, createNotification);
router.put('/:id/read', authMiddleware, markRead);

module.exports = router;
