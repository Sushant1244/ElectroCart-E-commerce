const adapter = require('../models/adapter');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { createUser: createInMemoryUser, findUserByEmail, setResetTokenForEmail, resetPasswordByHashedToken } = require('../utils/inMemoryAuth');
const { sendMail } = require('../utils/mailer');

// Use a default secret during local development to avoid crashes when
// JWT_SECRET isn't defined. In production, always set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// helpers to reduce cognitive complexity in login
async function safeCompare(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error_) {
    console.error('bcrypt compare failed:', error_?.stack ?? error_);
    throw new Error('Internal error');
  }
}

function safeSign(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error_) {
    console.error('jwt.sign failed:', error_?.stack ?? error_);
    throw new Error('Internal error');
  }
}

exports.register = async (req, res) => {
  // Check if adapter.User is functional; if not, fall back to in-memory
  const dbAvailable = !!(adapter?.User && typeof adapter.User.findOne === 'function');
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
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
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
    console.log('login attempt for', email);
    let user;
    try {
      user = await adapter.User.findOne({ email });
      console.log('user lookup result (adapter):', !!user);
    } catch (adapterErr) {
      console.error('adapter.User.findOne failed:', adapterErr?.stack ?? adapterErr);
      // fallback to in-memory auth if available
      try {
        user = await findUserByEmail(email);
        console.log('user lookup result (in-memory fallback):', !!user);
      } catch (memErr) {
        console.error('in-memory fallback failed:', memErr?.stack ?? memErr);
        throw adapterErr;
      }
    }
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    // normalize possible password property names from adapters
    const hash = String(user.password ?? user.passwordHash ?? '');
  const ok = await safeCompare(password, hash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = safeSign({ id: user._id || user.id });
  res.json({ token, user: { id: user._id || user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (e) {
  try { console.error('login error:', e?.stack ?? e); } catch (error_) { console.error('Failed to log login error', error_); }
  res.status(500).json({ message: e?.message ?? '' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    // Look up user via adapter; do not reveal existence for security
    let user = null;
    try {
      user = await adapter.User.findOne({ email });
    } catch (err) {
      user = null;
    }

    // If adapter didn't find a user (for example when using in-memory users), try the in-memory store
    if (!user) {
      try {
        const mem = await findUserByEmail(email);
        if (mem) {
          // store reset token for in-memory user so it can be verified later
          await setResetTokenForEmail(email, hashed, Date.now() + 10 * 60 * 1000);
          // send email and return generic success
          const resetUrlMem = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
          try {
            sendMail(
              email,
              'Reset your ElectroCart password',
              `You requested a password reset. Use the following link to reset your password: ${resetUrlMem}`,
              `<p>Reset link: <a href="${resetUrlMem}">${resetUrlMem}</a></p>`
            ).catch(() => {});
          } catch (e) { /* ignore */ }
          return res.json({ message: 'If email exists, password reset link has been sent', success: true });
        }
      } catch (e) {
        // ignore and fall through to generic response
      }
      return res.json({ message: 'If email exists, password reset link has been sent', success: true });
    }

  // Generate reset token and store hashed token and expiry on the user record.
    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(resetToken).digest('hex');

    // adapter may return plain objects; try to update via adapter if supported
    if (user.id && adapter.User.findById) {
      const id = user._id || user.id;
      if (adapter.User.findByIdAndUpdate) {
        await adapter.User.findByIdAndUpdate(id, { resetPasswordToken: hashed, resetPasswordExpire: Date.now() + 10 * 60 * 1000 });
      }
    }

  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
  // DEV-FALLBACK: keep a copy of the plain token in memory for quick testing when DB persistence is inconsistent
  exports.__devLastReset = exports.__devLastReset || {};
  exports.__devLastReset[email] = { resetToken, hashed, expiresAt: Date.now() + 10 * 60 * 1000 };
    // Send reset link via email (non-blocking). In dev this uses the mailer stub which logs the message.
    try {
      sendMail(
        email,
        'Reset your ElectroCart password',
        `You requested a password reset. Use the following link to reset your password: ${resetUrl}`,
        `<p>You requested a password reset. Click the link below to reset your password (expires in 10 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      ).catch((err) => console.error('Forgot password email failed:', err && err.message ? err.message : err));
    } catch (mailErr) {
      console.error('sendMail threw:', mailErr && mailErr.message ? mailErr.message : mailErr);
    }

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
    // Try adapter-backed lookup first
    let users = [];
    try {
      users = await (adapter.User.find ? adapter.User.find({ resetPasswordToken }) : []);
    } catch (err) {
      users = [];
    }
    let user = Array.isArray(users) ? users.find(u => u.resetPasswordToken === resetPasswordToken) : users;

    // If not found in adapter (e.g., using in-memory), try the in-memory reset helper
    if (!user) {
      // DEV-FALLBACK: accept token from recent forgotPassword call
      const devStore = exports.__devLastReset || {};
      const entry = Object.values(devStore).find(e => e.hashed === resetPasswordToken);
      if (entry) {
        // allow reset using direct in-memory token
        const hashedPassword = await bcrypt.hash(password, 10);
        // try to find user by email via adapter
        try {
          const possible = await adapter.User.findOne({ email: Object.keys(devStore).find(k => devStore[k].hashed === resetPasswordToken) });
          if (possible && adapter.User.findByIdAndUpdate) {
            await adapter.User.findByIdAndUpdate(possible._id || possible.id, { password: hashedPassword, resetPasswordToken: null, resetPasswordExpire: null });
            return res.json({ message: 'Password reset successful' });
          }
        } catch (e) { /* ignore */ }
        // otherwise, try in-memory helper
        try {
          const ok = await resetPasswordByHashedToken(resetPasswordToken, password);
          if (ok) return res.json({ message: 'Password reset successful' });
        } catch (e) { /* ignore */ }
      }
      try {
        const ok = await resetPasswordByHashedToken(resetPasswordToken, password);
        if (ok) return res.json({ message: 'Password reset successful' });
      } catch (e) {
        // ignore and return invalid token below
      }
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

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