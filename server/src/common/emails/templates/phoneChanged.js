const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    added: {
      heading: "A phone number was added to your account",
      intro: (maskedPhone) =>
        `A phone number (${maskedPhone}) was just verified and added to your ${BRAND.name} account.`,
    },
    updated: {
      heading: "Your phone number was changed",
      intro: (maskedPhone) =>
        `Your ${BRAND.name} account's phone number was just changed to ${maskedPhone}.`,
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    ctaText: "Review account activity",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account. If you didn't make this change, contact support immediately.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    added: {
      heading: "Un numéro de téléphone a été ajouté à votre compte",
      intro: (maskedPhone) =>
        `Un numéro de téléphone (${maskedPhone}) vient d'être vérifié et ajouté à votre compte ${BRAND.name}.`,
    },
    updated: {
      heading: "Votre numéro de téléphone a été modifié",
      intro: (maskedPhone) =>
        `Le numéro de téléphone de votre compte ${BRAND.name} vient d'être changé pour ${maskedPhone}.`,
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    ctaText: "Consulter l'activité du compte",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function phoneChangedEmail(data) {
  const { name, action, maskedPhone, reviewActivityUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`phoneChangedEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(maskedPhone)}</p>
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

module.exports = { phoneChangedEmail };
