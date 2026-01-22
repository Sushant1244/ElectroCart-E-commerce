const adapter = require('../models/adapter');
const { sendMail } = require('../utils/mailer');
const { wrapHtml } = require('../utils/emailTemplates');

exports.listNotifications = async (req, res) => {
  try {
    // If user is admin and wants all notifications, allow but default to user-specific
    const q = {};
    if (!req.user?.isAdmin) {
      const uid = req.user && (req.user._id || req.user.id);
      if (uid) q.userId = uid;
    }
    const notifs = await adapter.Notification.find(q);
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { userId, title, body, meta } = req.body;
    const created = await adapter.Notification.create({ userId: userId || null, title, body, meta: meta || {} });
    // optionally send email if userId provided and email exists
    if (userId && created) {
      try {
        // load user to get email
        const user = await adapter.User.findById(userId);
        if (user && user.email) {
              const html = wrapHtml(title, `<p>${body || ''}</p><p><a href="${process.env.CLIENT_URL || ''}/orders" style="display:inline-block;padding:8px 12px;background:#2563eb;color:white;border-radius:6px;text-decoration:none">View Orders</a></p>`);
              sendMail(user.email, title, body || '', html).catch(() => {});
            }
      } catch (e) { /* ignore */ }
    }
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await adapter.Notification.findByIdAndUpdate(id, { read: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
