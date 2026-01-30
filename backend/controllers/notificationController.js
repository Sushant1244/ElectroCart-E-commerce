const adapter = require('../models/adapter');
const { sendMail } = require('../utils/mailer');
const { pickEmail } = require('../utils/emailHelpers');
const { wrapHtml } = require('../utils/emailTemplates');
// reuse existing escape helper from orderController (keep local copy to avoid circular import)
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
        if (user) {
              const to = pickEmail(user.email);
              if (to) {
                // sanitize title and body for HTML context
                const safeTitle = escapeHtml(title || 'Notification');
                // Validate and sanitize CLIENT_URL before interpolating into href to avoid XSS
                let clientUrl = process.env.CLIENT_URL || '';
                try {
                  if (!clientUrl) throw new Error('empty');
                  const parsed = new URL(clientUrl, 'https://your-default-host');
                  // only allow http(s) schemes and require a hostname
                  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error('invalid');
                  // reconstruct an absolute URL string and encode it for safe interpolation
                  clientUrl = parsed.origin;
                } catch (e) {
                  clientUrl = 'https://your-default-host';
                }
                const safeOrdersHref = encodeURI(clientUrl + '/orders');
                const safeBodyHtml = `<p>${escapeHtml(body || '')}</p><p><a href="${safeOrdersHref}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:white;border-radius:6px;text-decoration:none">View Orders</a></p>`;
                const html = wrapHtml(safeTitle, safeBodyHtml);
                const plainText = body || '';
                Promise.resolve(sendMail(to, safeTitle, plainText, html)).catch((err) => {
                  console.error('sendMail failed for notification', { to, title: safeTitle, err: err && (err.message || err) });
                });
              }
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
