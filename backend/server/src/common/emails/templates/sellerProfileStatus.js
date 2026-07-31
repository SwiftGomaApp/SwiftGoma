const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    created: {
      heading: "Your seller profile has been created",
      intro: (businessName) =>
        `Your seller profile for <strong>${businessName}</strong> has been created on ${BRAND.name}. Complete your KYC verification to activate your shop.`,
      ctaText: "Continue onboarding",
    },
    activated: {
      heading: "Your seller profile is now active",
      intro: (businessName) =>
        `Congratulations — <strong>${businessName}</strong> has been verified and your seller profile is now active on ${BRAND.name}.`,
      ctaText: "Go to your dashboard",
    },
    suspended: {
      heading: "Your seller profile has been suspended",
      intro: (businessName, reason) =>
        reason
          ? `Your seller profile for <strong>${businessName}</strong> has been suspended. Reason: ${reason}`
          : `Your seller profile for <strong>${businessName}</strong> has been suspended by our team.`,
      ctaText: "Contact support",
    },
    reactivated: {
      heading: "Your seller profile has been reactivated",
      intro: (businessName) =>
        `Good news — your seller profile for <strong>${businessName}</strong> has been reactivated. You're back in business.`,
      ctaText: "Go to your dashboard",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this because it concerns your seller account on ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    created: {
      heading: "Votre profil vendeur a été créé",
      intro: (businessName) =>
        `Votre profil vendeur pour <strong>${businessName}</strong> a été créé sur ${BRAND.name}. Complétez votre vérification KYC pour activer votre boutique.`,
      ctaText: "Continuer l'inscription",
    },
    activated: {
      heading: "Votre profil vendeur est maintenant actif",
      intro: (businessName) =>
        `Félicitations — <strong>${businessName}</strong> a été vérifié et votre profil vendeur est maintenant actif sur ${BRAND.name}.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    suspended: {
      heading: "Votre profil vendeur a été suspendu",
      intro: (businessName, reason) =>
        reason
          ? `Votre profil vendeur pour <strong>${businessName}</strong> a été suspendu. Raison : ${reason}`
          : `Votre profil vendeur pour <strong>${businessName}</strong> a été suspendu par notre équipe.`,
      ctaText: "Contacter le support",
    },
    reactivated: {
      heading: "Votre profil vendeur a été réactivé",
      intro: (businessName) =>
        `Bonne nouvelle — votre profil vendeur pour <strong>${businessName}</strong> a été réactivé. Vous êtes de retour en activité.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail car cela concerne votre compte vendeur sur ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function sellerProfileStatusEmail(data) {
  const { name, businessName, action, reason, actionUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`sellerProfileStatusEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(businessName, reason)}</p>
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

module.exports = { sellerProfileStatusEmail };
