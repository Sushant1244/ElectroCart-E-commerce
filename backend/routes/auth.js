const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;