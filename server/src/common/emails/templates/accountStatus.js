const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    blocked: {
      heading: "Your account has been blocked",
      intro: (reason) =>
        reason
          ? `Your ${BRAND.name} account has been blocked. Reason: ${reason}`
          : `Your ${BRAND.name} account has been blocked by our team.`,
      ctaText: "Contact support",
    },
    unblocked: {
      heading: "Your account has been unblocked",
      intro: () =>
        `Good news — your ${BRAND.name} account has been unblocked. You can log back in whenever you're ready.`,
      ctaText: "Log back in",
    },
    roleChanged: {
      heading: "Your account role has changed",
      intro: (reason) =>
        `Your ${BRAND.name} account permissions have been updated${reason ? ` (${reason})` : ""}. You may need to log back in for this to take effect.`,
      ctaText: "Log back in",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this as a security notification for your ${BRAND.name} account.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    blocked: {
      heading: "Votre compte a été bloqué",
      intro: (reason) =>
        reason
          ? `Votre compte ${BRAND.name} a été bloqué. Raison : ${reason}`
          : `Votre compte ${BRAND.name} a été bloqué par notre équipe.`,
      ctaText: "Contacter le support",
    },
    unblocked: {
      heading: "Votre compte a été débloqué",
      intro: () =>
        `Bonne nouvelle — votre compte ${BRAND.name} a été débloqué. Vous pouvez vous reconnecter dès maintenant.`,
      ctaText: "Se reconnecter",
    },
    roleChanged: {
      heading: "Le rôle de votre compte a changé",
      intro: (reason) =>
        `Les autorisations de votre compte ${BRAND.name} ont été mises à jour${reason ? ` (${reason})` : ""}. Vous devrez peut-être vous reconnecter pour que cela prenne effet.`,
      ctaText: "Se reconnecter",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function accountStatusEmail(data) {
  const { name, action, reason, actionUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`accountStatusEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(reason)}</p>
  `;

  const html = renderEmailLayout({
    preheader: content.heading,
    heading: content.heading,
    bodyHtml,
    cta: { text: content.ctaText, url: actionUrl },
    reason: t.reason,
    locale,
  });

  return { subject: `${t.subjectPrefix} ${content.heading}`, html };
}

module.exports = { accountStatusEmail };
