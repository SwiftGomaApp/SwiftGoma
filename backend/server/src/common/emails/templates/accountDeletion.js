const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    deleted: {
      heading: "Your account has been deleted",
      intro: (days) =>
        `Your ${BRAND.name} account has been deleted. If this wasn't you, or you'd like it back, you can recover it within ${days} days.`,
      ctaText: "Recover your account",
    },
    restored: {
      heading: "Your account has been restored",
      intro: () =>
        `Welcome back — your ${BRAND.name} account has been successfully restored.`,
      ctaText: "Review account activity",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this as a security notification for your ${BRAND.name} account.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    deleted: {
      heading: "Votre compte a été supprimé",
      intro: (days) =>
        `Votre compte ${BRAND.name} a été supprimé. Si ce n'était pas vous, ou si vous souhaitez le récupérer, vous pouvez le restaurer dans un délai de ${days} jours.`,
      ctaText: "Récupérer votre compte",
    },
    restored: {
      heading: "Votre compte a été restauré",
      intro: () =>
        `Bon retour — votre compte ${BRAND.name} a été restauré avec succès.`,
      ctaText: "Consulter l'activité du compte",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail à titre de notification de sécurité pour votre compte ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function accountDeletionEmail(data) {
  const { name, action, actionUrl, recoveryDays, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`accountDeletionEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(recoveryDays)}</p>
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

module.exports = { accountDeletionEmail };
