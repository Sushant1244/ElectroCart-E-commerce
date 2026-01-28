const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  NODE_ENV,
} = process.env;

// transporter is created lazily; initTransport will set it up.
let transporter = null;
let usingEthereal = false;

async function initTransport() {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465, // true for 465, false for other ports
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    console.log('[mailer] using SMTP transport', { host: SMTP_HOST, port: SMTP_PORT || 587 });
    // verify transporter connectivity/config now so failures are visible immediately
    try {
      await transporter.verify();
      console.log('[mailer] SMTP transport verified successfully');
    } catch (vErr) {
      console.error('[mailer] SMTP transport verification failed:', vErr && vErr.message ? vErr.message : vErr);
      // keep transporter so sendMail will still attempt and surface errors per message
    }
    return transporter;
  }

  // If we're in production and SMTP is not configured, it's a likely misconfiguration.
  if (NODE_ENV === 'production') {
    console.error('[mailer] SMTP not configured in production (SMTP_HOST/SMTP_USER missing). Emails will fail.');
    // create a rejecting transporter so callers get a clear error
    transporter = {
      sendMail: () => Promise.reject(new Error('SMTP not configured in production')),
    };
    return transporter;
  }

  // Development fallback: create an Ethereal test account so emails can be inspected locally
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    usingEthereal = true;
    console.log('[mailer] no SMTP configured; using ethereal test account for local email previews');
    return transporter;
  } catch (e) {
    // last-resort stub transport
    console.warn('[mailer] failed to create ethereal test account, falling back to console-stub:', e && e.message ? e.message : e);
    transporter = {
      sendMail: (opts) => {
        console.log('[mailer stub] sendMail called with:', {
          from: opts.from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
        });
        return Promise.resolve({ accepted: [opts.to] });
      },
    };
    return transporter;
  }
}

async function sendMail(to, subject, text, html) {
  const from = FROM_EMAIL || 'no-reply@electrocart.local';
  const mailOptions = { from, to, subject, text, html };
  try {
    await initTransport();
    const res = await transporter.sendMail(mailOptions);
    // nodemailer returns additional info; if ethereal was used, print preview url
    try {
      if (usingEthereal && res) {
        const preview = nodemailer.getTestMessageUrl(res);
        if (preview) console.log('[mailer] Preview URL:', preview);
      }
    } catch (e) { /* ignore preview errors */ }
    console.log('[mailer] sent', res && res.accepted ? res.accepted : res);
    return res;
  } catch (err) {
    console.error('[mailer] error sending email:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendMail };
