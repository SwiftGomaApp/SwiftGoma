const nodemailer = require("nodemailer");

const { env } = require("./env");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html, attachments }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.fromEmail}>`,
    to,
    subject,
    html,
    ...(attachments && { attachments }),
  });
}

async function checkMailerConnection(timeoutMs = 5000) {
  const startedAt = Date.now();
  const transport = getTransporter();

  const verify = transport.verify();
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`SMTP check timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    await Promise.race([verify, timeout]);
    return { connected: true, latencyMs: Date.now() - startedAt, error: null };
  } catch (err) {
    console.error("[mailer] SMTP connection check failed:", err.message);
    return { connected: false, latencyMs: null, error: err.message };
  }
}

module.exports = { getTransporter, sendMail, checkMailerConnection };
