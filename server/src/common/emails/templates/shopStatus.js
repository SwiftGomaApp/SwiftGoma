const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    suspended: {
      heading: "Your shop has been suspended",
      intro: (shopName, reason) =>
        reason
          ? `Your shop <strong>${shopName}</strong> has been suspended. Reason: ${reason}`
          : `Your shop <strong>${shopName}</strong> has been suspended by our team.`,
      ctaText: "Contact support",
    },
    reactivated: {
      heading: "Your shop has been reactivated",
      intro: (shopName) =>
        `Good news — your shop <strong>${shopName}</strong> has been reactivated and is visible to buyers again.`,
      ctaText: "View my shop",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this because it concerns your ${BRAND.name} shop.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    suspended: {
      heading: "Votre boutique a été suspendue",
      intro: (shopName, reason) =>
        reason
          ? `Votre boutique <strong>${shopName}</strong> a été suspendue. Raison : ${reason}`
          : `Votre boutique <strong>${shopName}</strong> a été suspendue par notre équipe.`,
      ctaText: "Contacter le support",
    },
    reactivated: {
      heading: "Votre boutique a été réactivée",
      intro: (shopName) =>
        `Bonne nouvelle — votre boutique <strong>${shopName}</strong> a été réactivée et est de nouveau visible par les acheteurs.`,
      ctaText: "Voir ma boutique",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail car cela concerne votre boutique ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function shopStatusEmail(data) {
  const { name, action, shopName, reason, actionUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`shopStatusEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(shopName, reason)}</p>
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

module.exports = { shopStatusEmail };
