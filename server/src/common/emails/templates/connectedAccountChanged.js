const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    google_linked: {
      heading: "Google account connected",
      intro: `A Google account was just linked to your ${BRAND.name} account. You can now sign in with it.`,
    },
    google_unlinked: {
      heading: "Google account disconnected",
      intro: `A Google account was just unlinked from your ${BRAND.name} account. You can no longer sign in with it.`,
    },
    apple_linked: {
      heading: "Apple account connected",
      intro: `An Apple account was just linked to your ${BRAND.name} account. You can now sign in with it.`,
    },
    apple_unlinked: {
      heading: "Apple account disconnected",
      intro: `An Apple account was just unlinked from your ${BRAND.name} account. You can no longer sign in with it.`,
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    ctaText: "Review account activity",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account. If you didn't make this change, contact support immediately.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    google_linked: {
      heading: "Compte Google connecté",
      intro: `Un compte Google vient d'être lié à votre compte ${BRAND.name}. Vous pouvez désormais vous connecter avec.`,
    },
    google_unlinked: {
      heading: "Compte Google déconnecté",
      intro: `Un compte Google vient d'être délié de votre compte ${BRAND.name}. Vous ne pouvez plus vous connecter avec.`,
    },
    apple_linked: {
      heading: "Compte Apple connecté",
      intro: `Un compte Apple vient d'être lié à votre compte ${BRAND.name}. Vous pouvez désormais vous connecter avec.`,
    },
    apple_unlinked: {
      heading: "Compte Apple déconnecté",
      intro: `Un compte Apple vient d'être délié de votre compte ${BRAND.name}. Vous ne pouvez plus vous connecter avec.`,
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    ctaText: "Consulter l'activité du compte",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function connectedAccountChangedEmail(data) {
  const { name, action, reviewActivityUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`connectedAccountChangedEmail: unknown action "${action}"`);
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

module.exports = { connectedAccountChangedEmail };
