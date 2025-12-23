const adapter = require('../models/adapter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createUser: createInMemoryUser, findUserByEmail } = require('../utils/inMemoryAuth');
const { sendMail } = require('../utils/mailer');

// Use a default secret during local development to avoid crashes when
// JWT_SECRET isn't defined. In production, always set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.register = async (req, res) => {
  // Check if adapter.User is functional; if not, fall back to in-memory
  const dbAvailable = adapter && adapter.User && typeof adapter.User.findOne === 'function';
  if (!dbAvailable) {
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
    const exists = await adapter.User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email exists' });

    const hashed = await bcrypt.hash(password, 10);
    // adapter.User.create expects either mongoose User or PG User
    const createData = { name, email, password: hashed, isAdmin: !!isAdmin };
    const user = await adapter.User.create(createData);
  const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
    // send welcome email in background (non-blocking)
    sendMail(
      user.email,
      'Welcome to ElectroCart',
      `Hi ${user.name || ''},\n\nThanks for registering at ElectroCart!`,
      `<p>Hi ${user.name || ''},</p><p>Thanks for registering at <strong>ElectroCart</strong>!</p>`
    ).catch((err) => console.error('Welcome email failed:', err && err.message ? err.message : err));

  res.json({ token, user: { id: user._id || user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const dbAvailable = adapter && adapter.User && typeof adapter.User.findOne === 'function';
  if (!dbAvailable) {
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
    const user = await adapter.User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password || user.passwordHash || user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id || user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
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
    // Look up user via adapter; do not reveal existence for security
    const user = await adapter.User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If email exists, password reset link has been sent', success: true });
    }

    // Generate reset token and store hashed token and expiry on the user record.
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    // adapter may return plain objects; try to update via adapter if supported
    if (user.id && adapter.User.findById) {
      const id = user._id || user.id;
      await adapter.User.findByIdAndUpdate ? adapter.User.findByIdAndUpdate(id, { resetPasswordToken: hashed, resetPasswordExpire: Date.now() + 10 * 60 * 1000 }) : null;
    }

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    res.json({ message: 'Password reset token generated successfully', success: true, resetToken, resetUrl });
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
    // Find user via adapter. For PG adapter, findAll with where can be used.
    const users = await adapter.User.find ? await adapter.User.find({ resetPasswordToken }) : [];
    const user = Array.isArray(users) ? users.find(u => u.resetPasswordToken === resetPasswordToken) : users;
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = user._id || user.id;
    if (adapter.User.findByIdAndUpdate) {
      await adapter.User.findByIdAndUpdate(id, { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null });
      return res.json({ message: 'Password reset successful' });
    }

    // If adapter doesn't support update, return error
    res.status(500).json({ message: 'Password reset not supported in this configuration' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};