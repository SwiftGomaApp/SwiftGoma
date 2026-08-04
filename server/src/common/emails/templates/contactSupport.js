const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function contactSupportEmail({ name, email, subjectLabel, message }) {
  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">New contact form submission on ${BRAND.name}.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0; width: 100%;">
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted}; width: 90px;">Name</td>
        <td style="padding: 4px 0;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted};">Email</td>
        <td style="padding: 4px 0;"><a href="mailto:${escapeHtml(email)}" style="color: ${BRAND.colors.text};">${escapeHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted};">Subject</td>
        <td style="padding: 4px 0;">${escapeHtml(subjectLabel)}</td>
      </tr>
    </table>
    <p style="margin: 0 0 8px 0; color: ${BRAND.colors.muted};">Message</p>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
  `;

  const html = renderEmailLayout({
    preheader: `${subjectLabel} — from ${name}`,
    heading: "New support message",
    bodyHtml,
    cta: null,
    reason: "You're receiving this because someone submitted the contact form on the SwiftGoma help page.",
    locale: "en",
  });

  return { subject: `[Support] ${subjectLabel} — from ${name}`, html };
}

module.exports = { contactSupportEmail };
