const jwt = require('jsonwebtoken');
const adapter = require('../models/adapter');

// Use same fallback secret as authController to avoid verify mismatches in dev
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
  const decoded = jwt.verify(token, JWT_SECRET);
    // adapter.User.findByIdSelect returns user without password when available
    if (adapter.User.findByIdSelect) {
      req.user = await adapter.User.findByIdSelect(decoded.id);
    } else {
      // fallback: try findById and remove password
      const u = await adapter.User.findById(decoded.id);
      if (u) { delete u.password; delete u.passwordHash; }
      req.user = u;
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

exports.adminMiddleware = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  next();
};