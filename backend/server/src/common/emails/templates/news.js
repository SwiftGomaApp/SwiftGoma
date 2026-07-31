const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    subject: (title) => `${BRAND.name}: ${title}`,
    reason: `You're receiving this because you're subscribed to ${BRAND.name} news and updates. You can manage your email preferences in your account settings.`,
  },
  fr: {
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    subject: (title) => `${BRAND.name} : ${title}`,
    reason: `Vous recevez cet e-mail car vous êtes abonné(e) aux actualités et mises à jour de ${BRAND.name}. Vous pouvez gérer vos préférences d'e-mail dans les paramètres de votre compte.`,
  },
};

function newsEmail(data) {
  const { name, title, bodyHtml: content, cta, locale = "en" } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    ${content}
  `;

  const html = renderEmailLayout({
    preheader: title,
    heading: title,
    bodyHtml,
    cta: cta || null,
    reason: t.reason,
    locale,
  });

  return { subject: t.subject(title), html };
}

module.exports = { newsEmail };
