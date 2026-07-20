const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    renewing_soon: {
      heading: (plan) => `Your ${plan} plan renews soon`,
      intro: (plan, date) =>
        `Your <strong>${plan}</strong> subscription is set to renew on <strong>${date}</strong>.`,
      ctaText: "Manage subscription",
      reason:
        "You're receiving this because you have an active Swiftgoma seller subscription.",
    },
    renewed: {
      heading: (plan) => `Your ${plan} plan has been renewed`,
      intro: (plan, date) =>
        `Your <strong>${plan}</strong> subscription was successfully renewed on <strong>${date}</strong>.`,
      ctaText: "View billing",
      reason:
        "You're receiving this because your Swiftgoma seller subscription was just renewed.",
    },
    expired: {
      heading: (plan) => `Your ${plan} plan has expired`,
      intro: (plan) =>
        `Your <strong>${plan}</strong> subscription has expired. Your shop may be limited until you renew.`,
      ctaText: "Renew now",
      reason:
        "You're receiving this because your Swiftgoma seller subscription has expired.",
    },
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    renewing_soon: {
      heading: (plan) => `Votre formule ${plan} se renouvelle bientôt`,
      intro: (plan, date) =>
        `Votre abonnement <strong>${plan}</strong> sera renouvelé le <strong>${date}</strong>.`,
      ctaText: "Gérer l'abonnement",
      reason:
        "Vous recevez cet e-mail car vous avez un abonnement vendeur Swiftgoma actif.",
    },
    renewed: {
      heading: (plan) => `Votre formule ${plan} a été renouvelée`,
      intro: (plan, date) =>
        `Votre abonnement <strong>${plan}</strong> a été renouvelé avec succès le <strong>${date}</strong>.`,
      ctaText: "Voir la facturation",
      reason:
        "Vous recevez cet e-mail car votre abonnement vendeur Swiftgoma vient d'être renouvelé.",
    },
    expired: {
      heading: (plan) => `Votre formule ${plan} a expiré`,
      intro: (plan) =>
        `Votre abonnement <strong>${plan}</strong> a expiré. Votre boutique peut être limitée jusqu'à son renouvellement.`,
      ctaText: "Renouveler maintenant",
      reason:
        "Vous recevez cet e-mail car votre abonnement vendeur Swiftgoma a expiré.",
    },
    subjectPrefix: `${BRAND.name} —`,
  },
};

function subscriptionEmail(data) {
  const { name, status, planName, date, manageUrl, locale = "en" } = data;
  const copy = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = copy[status];
  if (!content) {
    throw new Error(`subscriptionEmail: unknown status "${status}"`);
  }

  const heading = content.heading(planName);
  const helloText =
    locale === "fr"
      ? `Bonjour, <strong>${name}</strong>.`
      : `Hello, <strong>${name}</strong>.`;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${helloText}</p>
    <p style="margin: 0;">${content.intro(planName, date)}</p>
  `;

  const html = renderEmailLayout({
    preheader: heading,
    heading,
    bodyHtml,
    cta: { text: content.ctaText, url: manageUrl },
    reason: content.reason,
    locale,
  });

  return { subject: `${copy.subjectPrefix} ${heading}`, html };
}

module.exports = { subscriptionEmail };
