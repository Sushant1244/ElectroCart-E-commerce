const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

// Apply rate limiting to auth endpoints to mitigate brute-force and abuse.
const authLimiter = rateLimit({
	// allow 100 requests per 15 minutes per IP by default for auth endpoints
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
	message: { message: 'Too many requests from this IP, please try again later.' }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/verify-email', authLimiter, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

module.exports = router;