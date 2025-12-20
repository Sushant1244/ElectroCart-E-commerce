const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createUser: createInMemoryUser, findUserByEmail } = require('../utils/inMemoryAuth');

// Use a default secret during local development to avoid crashes when
// JWT_SECRET isn't defined. In production, always set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.register = async (req, res) => {
  // Verify DB connection before attempting operations
  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    // Fall back to in-memory store for development
    try {
      const { name, email, password, isAdmin } = req.body;
      const existing = await findUserByEmail(email);
      if (existing) return res.status(400).json({ message: 'Email exists' });
      const user = await createInMemoryUser({ name, email, password, isAdmin });
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
  const { name, email, password, isAdmin } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, isAdmin: !!isAdmin });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    // Try in-memory login
    try {
      const user = await findUserByEmail(email);
      if (!user) return res.status(400).json({ message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
    } catch (e) {
      return res.status(500).json({ message: e.message });
    }
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If email exists, password reset link has been sent',
        success: true 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });

    // In production, send email with reset link
    // For now, return the token (in production, this should be sent via email)
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    res.json({ 
      message: 'Password reset token generated successfully',
      success: true,
      resetToken, // Remove this in production, send via email instead
      resetUrl 
    });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ 
      message: e.message || 'Failed to process password reset request',
      success: false 
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};