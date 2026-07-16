const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    created: {
      heading: "Your password has been set",
      intro: `A password was added to your ${BRAND.name} account.`,
    },
    updated: {
      heading: "Your password has been changed",
      intro: `Your ${BRAND.name} account password was just changed.`,
    },
    reset: {
      heading: "Your password has been reset",
      intro: `Your ${BRAND.name} account password was just reset.`,
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    ctaText: "Review account activity",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account. If you didn't make this change, contact support immediately.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    created: {
      heading: "Votre mot de passe a été défini",
      intro: `Un mot de passe a été ajouté à votre compte ${BRAND.name}.`,
    },
    updated: {
      heading: "Votre mot de passe a été modifié",
      intro: `Le mot de passe de votre compte ${BRAND.name} vient d'être modifié.`,
    },
    reset: {
      heading: "Votre mot de passe a été réinitialisé",
      intro: `Le mot de passe de votre compte ${BRAND.name} vient d'être réinitialisé.`,
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    ctaText: "Consulter l'activité du compte",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function passwordChangedEmail(data) {
  const { name, action, reviewActivityUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`passwordChangedEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro}</p>
  `;

  const html = renderEmailLayout({
    preheader: content.heading,
    heading: content.heading,
    bodyHtml,
    cta: { text: t.ctaText, url: reviewActivityUrl },
    reason: t.reason,
    locale,
  });

  return { subject: `${t.subjectPrefix} ${content.heading}`, html };
}

module.exports = { passwordChangedEmail };
