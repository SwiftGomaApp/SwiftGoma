const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const SCOPE_CONTENT = {
  en: {
    single: {
      heading: "A session was signed out",
      intro: () =>
        `One of your ${BRAND.name} sessions was signed out by our team for security reasons. If this device is still yours, you'll need to log in again.`,
    },
    all: {
      heading: "You've been signed out everywhere",
      intro: () =>
        `All active sessions on your ${BRAND.name} account were signed out by our team for security reasons. You'll need to log in again on every device.`,
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    ctaText: "Log back in",
    reason: `You're receiving this as a security notification for your ${BRAND.name} account. If you didn't expect this, please contact support immediately.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    single: {
      heading: "Une session a été déconnectée",
      intro: () =>
        `Une de vos sessions ${BRAND.name} a été déconnectée par notre équipe pour des raisons de sécurité. Si cet appareil est toujours le vôtre, vous devrez vous reconnecter.`,
    },
    all: {
      heading: "Vous avez été déconnecté de tous vos appareils",
      intro: () =>
        `Toutes les sessions actives de votre compte ${BRAND.name} ont été déconnectées par notre équipe pour des raisons de sécurité. Vous devrez vous reconnecter sur chaque appareil.`,
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    ctaText: "Se reconnecter",
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}. Si vous ne vous attendiez pas à cela, veuillez contacter le support immédiatement.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function sessionsRevokedEmail(data) {
  const { name, scope, actionUrl, locale = "en" } = data;
  const t = SCOPE_CONTENT[locale] || SCOPE_CONTENT.en;
  const content = t[scope];
  if (!content) {
    throw new Error(`sessionsRevokedEmail: unknown scope "${scope}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro()}</p>
  `;

  const html = renderEmailLayout({
    preheader: content.heading,
    heading: content.heading,
    bodyHtml,
    cta: { text: t.ctaText, url: actionUrl },
    reason: t.reason,
    locale,
  });

  return { subject: `${t.subjectPrefix} ${content.heading}`, html };
}

module.exports = { sessionsRevokedEmail };
