const express = require('express');
const router = express.Router();
const controller = require('../controllers/inquiryController');
const authGuard = require('../helper/authguard');
const isAdmin = require('../helper/isAdmin');

// Public: submit an inquiry
router.post('/', controller.createInquiry);

// Admin-only: list inquiries
router.get('/', authGuard, isAdmin, controller.listInquiries);

module.exports = router;
