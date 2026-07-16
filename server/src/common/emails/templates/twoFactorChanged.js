const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    enabled: {
      heading: "Two-factor authentication enabled",
      intro: `Two-factor authentication was just turned on for your ${BRAND.name} account.`,
    },
    disabled: {
      heading: "Two-factor authentication disabled",
      intro: `Two-factor authentication was just turned off for your ${BRAND.name} account.`,
    },
    backup_codes_regenerated: {
      heading: "New backup codes generated",
      intro: `New two-factor backup codes were generated for your ${BRAND.name} account. Your old codes no longer work.`,
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    ctaText: "Review account activity",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account. If you didn't make this change, contact support immediately.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    enabled: {
      heading: "Authentification à deux facteurs activée",
      intro: `L'authentification à deux facteurs vient d'être activée pour votre compte ${BRAND.name}.`,
    },
    disabled: {
      heading: "Authentification à deux facteurs désactivée",
      intro: `L'authentification à deux facteurs vient d'être désactivée pour votre compte ${BRAND.name}.`,
    },
    backup_codes_regenerated: {
      heading: "Nouveaux codes de secours générés",
      intro: `De nouveaux codes de secours ont été générés pour votre compte ${BRAND.name}. Vos anciens codes ne fonctionnent plus.`,
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    ctaText: "Consulter l'activité du compte",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}. Si vous n'êtes pas à l'origine de ce changement, contactez le support immédiatement.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function twoFactorChangedEmail(data) {
  const { name, action, reviewActivityUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`twoFactorChangedEmail: unknown action "${action}"`);
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

module.exports = { twoFactorChangedEmail };
