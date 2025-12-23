const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
} = process.env;

let transporter;
if (SMTP_HOST && SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465, // true for 465, false for other ports
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  // fallback stub transport when SMTP is not configured (development)
  transporter = {
    sendMail: async (opts) => {
      console.log('[mailer stub] sendMail called with:', {
        from: opts.from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
      });
      return { accepted: [opts.to] };
    },
  };
}

async function sendMail(to, subject, text, html) {
  const from = FROM_EMAIL || 'no-reply@electrocart.local';
  const mailOptions = { from, to, subject, text, html };
  try {
    const res = await transporter.sendMail(mailOptions);
    console.log('[mailer] sent', res && res.accepted ? res.accepted : res);
    return res;
  } catch (err) {
    console.error('[mailer] error sending email:', err && err.message ? err.message : err);
    throw err;
  }
}

module.exports = { sendMail };
