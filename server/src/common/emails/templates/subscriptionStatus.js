const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    paymentSucceeded: {
      heading: "Your subscription is active",
      intro: (planName, periodEnd) =>
        `Payment received — your <strong>${planName}</strong> subscription is now active until <strong>${periodEnd}</strong>.`,
      ctaText: "Go to your dashboard",
    },
    paymentFailed: {
      heading: "Subscription payment failed",
      intro: (planName) =>
        `We couldn't process your payment for the <strong>${planName}</strong> plan. Please try again to activate your subscription.`,
      ctaText: "Retry payment",
    },
    renewalSucceeded: {
      heading: "Your subscription has been renewed",
      intro: (planName, periodEnd) =>
        `Your <strong>${planName}</strong> subscription was renewed successfully. Next billing date: <strong>${periodEnd}</strong>.`,
      ctaText: "Go to your dashboard",
    },
    renewalFailed: {
      heading: "Subscription renewal failed",
      intro: (planName, graceDays) =>
        `We couldn't renew your <strong>${planName}</strong> subscription. You have ${graceDays} days to update your payment before your shop is deactivated.`,
      ctaText: "Update payment",
    },
    expired: {
      heading: "Your subscription has expired",
      intro: (planName) =>
        `Your <strong>${planName}</strong> subscription has expired and your shop is no longer visible to buyers. Renew anytime to reactivate it.`,
      ctaText: "Renew subscription",
    },
    canceled: {
      heading: "Your subscription has been canceled",
      intro: (planName, periodEnd) =>
        `Your <strong>${planName}</strong> subscription was canceled. You'll keep access until <strong>${periodEnd}</strong>.`,
      ctaText: "Manage subscription",
    },
    invoiceIssued: {
      heading: "Your invoice is ready",
      intro: (planName) =>
        `An invoice for your <strong>${planName}</strong> subscription has been issued. Pay it to activate your subscription.`,
      ctaText: "View my invoice",
    },
    reactivated: {
      heading: "Your subscription has been reactivated",
      intro: (planName, periodEnd) =>
        `Welcome back — your <strong>${planName}</strong> subscription is active again, no new payment needed. It remains valid until <strong>${periodEnd}</strong>.`,
      ctaText: "Go to your dashboard",
    },
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    reason: `You're receiving this because it concerns your ${BRAND.name} seller subscription.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    paymentSucceeded: {
      heading: "Votre abonnement est actif",
      intro: (planName, periodEnd) =>
        `Paiement reçu — votre abonnement <strong>${planName}</strong> est maintenant actif jusqu'au <strong>${periodEnd}</strong>.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    paymentFailed: {
      heading: "Échec du paiement de l'abonnement",
      intro: (planName) =>
        `Nous n'avons pas pu traiter votre paiement pour le plan <strong>${planName}</strong>. Merci de réessayer pour activer votre abonnement.`,
      ctaText: "Réessayer le paiement",
    },
    renewalSucceeded: {
      heading: "Votre abonnement a été renouvelé",
      intro: (planName, periodEnd) =>
        `Votre abonnement <strong>${planName}</strong> a été renouvelé avec succès. Prochaine facturation : <strong>${periodEnd}</strong>.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    renewalFailed: {
      heading: "Échec du renouvellement de l'abonnement",
      intro: (planName, graceDays) =>
        `Nous n'avons pas pu renouveler votre abonnement <strong>${planName}</strong>. Vous avez ${graceDays} jours pour mettre à jour votre paiement avant que votre boutique ne soit désactivée.`,
      ctaText: "Mettre à jour le paiement",
    },
    expired: {
      heading: "Votre abonnement a expiré",
      intro: (planName) =>
        `Votre abonnement <strong>${planName}</strong> a expiré et votre boutique n'est plus visible par les acheteurs. Renouvelez à tout moment pour la réactiver.`,
      ctaText: "Renouveler l'abonnement",
    },
    canceled: {
      heading: "Votre abonnement a été annulé",
      intro: (planName, periodEnd) =>
        `Votre abonnement <strong>${planName}</strong> a été annulé. Vous garderez l'accès jusqu'au <strong>${periodEnd}</strong>.`,
      ctaText: "Gérer mon abonnement",
    },
    invoiceIssued: {
      heading: "Votre facture est disponible",
      intro: (planName) =>
        `Une facture pour votre abonnement <strong>${planName}</strong> a été émise. Réglez-la pour activer votre abonnement.`,
      ctaText: "Voir ma facture",
    },
    reactivated: {
      heading: "Votre abonnement a été réactivé",
      intro: (planName, periodEnd) =>
        `Bon retour — votre abonnement <strong>${planName}</strong> est de nouveau actif, sans nouveau paiement requis. Il reste valide jusqu'au <strong>${periodEnd}</strong>.`,
      ctaText: "Accéder à mon tableau de bord",
    },
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    reason: `Vous recevez cet e-mail car cela concerne votre abonnement vendeur ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function subscriptionStatusEmail(data) {
  const {
    name,
    action,
    planName,
    periodEnd,
    graceDays,
    actionUrl,
    locale = "en",
  } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`subscriptionStatusEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro(planName, periodEnd || graceDays)}</p>
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

module.exports = { subscriptionStatusEmail };
