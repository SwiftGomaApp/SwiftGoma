const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: "New support message",
    intro: (name) => `New contact form submission on ${BRAND.name}, from ${name}.`,
    nameLabel: "Name",
    emailLabel: "Email",
    subjectLabel: "Subject",
    messageLabel: "Message",
    preheader: (subjectLabel, name) => `${subjectLabel} — from ${name}`,
    subject: (subjectLabel, name) => `[Support] ${subjectLabel} — from ${name}`,
    reason: `You're receiving this because someone submitted the contact form on the ${BRAND.name} help page.`,
  },
  fr: {
    heading: "Nouveau message de support",
    intro: (name) => `Nouveau message reçu via le formulaire de contact ${BRAND.name}, de la part de ${name}.`,
    nameLabel: "Nom",
    emailLabel: "E-mail",
    subjectLabel: "Sujet",
    messageLabel: "Message",
    preheader: (subjectLabel, name) => `${subjectLabel} — de ${name}`,
    subject: (subjectLabel, name) => `[Support] ${subjectLabel} — de ${name}`,
    reason: `Vous recevez cet e-mail car quelqu'un a soumis le formulaire de contact sur la page d'aide ${BRAND.name}.`,
  },
};

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function contactSupportEmail({ name, email, subjectLabel, message, locale = "fr" }) {
  const t = COPY[locale] || COPY.fr;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.intro(escapeHtml(name))}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0; width: 100%;">
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted}; width: 90px;">${t.nameLabel}</td>
        <td style="padding: 4px 0;">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted};">${t.emailLabel}</td>
        <td style="padding: 4px 0;"><a href="mailto:${escapeHtml(email)}" style="color: ${BRAND.colors.text};">${escapeHtml(email)}</a></td>
      </tr>
      <tr>
        <td style="padding: 4px 0; color: ${BRAND.colors.muted};">${t.subjectLabel}</td>
        <td style="padding: 4px 0;">${escapeHtml(subjectLabel)}</td>
      </tr>
    </table>
    <p style="margin: 0 0 8px 0; color: ${BRAND.colors.muted};">${t.messageLabel}</p>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(subjectLabel, name),
    heading: t.heading,
    bodyHtml,
    cta: null,
    reason: t.reason,
    locale,
  });

  return { subject: t.subject(subjectLabel, name), html };
}

module.exports = { contactSupportEmail };
