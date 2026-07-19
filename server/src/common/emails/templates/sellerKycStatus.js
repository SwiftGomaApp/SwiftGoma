const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    submitted: {
      heading: "Your KYC documents have been submitted",
      intro: () =>
        `Your KYC documents have been received and are pending review. We'll notify you once they've been checked.`,
      ctaText: "Track my status",
    },
    support_reviewed: {
      heading: "Your KYC documents passed initial review",
      intro: () =>
        `Your KYC documents have passed our initial review and are now with our team for final approval.`,
      ctaText: "Track my status",
    },
    approved: {
      heading: "Your KYC has been approved",
      intro: () =>
        `Great news — your KYC verification has been approved. Your seller profile is now active on ${BRAND.name}.`,
      ctaText: "Go to your dashboard",
    },
    rejected: {
      heading: "Your KYC submission was rejected",
      intro: (reason) =>
        reason
          ? `Your KYC submission was rejected. Reason: ${reason} — please review and resubmit your documents.`
          : `Your KYC submission was rejected. Please review and resubmit your documents.`,
      ctaText: "Resubmit documents",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this because it concerns your seller KYC verification on ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    submitted: {
      heading: "Vos documents KYC ont été soumis",
      intro: () =>
        `Vos documents KYC ont été reçus et sont en attente de vérification. Nous vous notifierons une fois qu'ils auront été examinés.`,
      ctaText: "Suivre mon statut",
    },
    support_reviewed: {
      heading: "Vos documents KYC ont passé la première vérification",
      intro: () =>
        `Vos documents KYC ont passé notre première vérification et sont maintenant entre les mains de notre équipe pour approbation finale.`,
      ctaText: "Suivre mon statut",
    },
    approved: {
      heading: "Votre KYC a été approuvé",
      intro: () =>
        `Excellente nouvelle — votre vérification KYC a été approuvée. Votre profil vendeur est maintenant actif sur ${BRAND.name}.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    rejected: {
      heading: "Votre dossier KYC a été rejeté",
      intro: (reason) =>
        reason
          ? `Votre dossier KYC a été rejeté. Raison : ${reason} — veuillez revoir et resoumettre vos documents.`
          : `Votre dossier KYC a été rejeté. Veuillez revoir et resoumettre vos documents.`,
      ctaText: "Resoumettre mes documents",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail car cela concerne la vérification KYC de votre compte vendeur sur ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function sellerKycStatusEmail(data) {
  const { name, action, reason, actionUrl, locale = "en" } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`sellerKycStatusEmail: unknown action "${action}"`);
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

module.exports = { sellerKycStatusEmail };
