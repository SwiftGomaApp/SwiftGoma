const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    paymentFailed: {
      heading: "We couldn't process your payment",
      intro: ({ shopName }) =>
        `Your payment for the order from <strong>${shopName}</strong> didn't go through. No charge was made — you can try again whenever you're ready.`,
      ctaText: "Retry payment",
    },
    orderAccepted: {
      heading: "Good news — your order is confirmed",
      intro: ({ shopName }) =>
        `<strong>${shopName}</strong> has accepted your order and is getting it ready. We'll let you know as soon as it's on its way.`,
      ctaText: "Track my order",
    },
    orderRejected: {
      heading: "Your order couldn't be fulfilled",
      intro: ({ shopName, reason }) =>
        reason
          ? `<strong>${shopName}</strong> wasn't able to fulfill this order. Reason given: <em>${reason}</em>. Your payment has been fully refunded.`
          : `<strong>${shopName}</strong> wasn't able to fulfill this order. Your payment has been fully refunded.`,
      ctaText: "View my orders",
    },
    orderExpired: {
      heading: "Your order timed out",
      intro: ({ shopName }) =>
        `<strong>${shopName}</strong> didn't respond in time, so we've cancelled the order automatically. Your payment has been fully refunded — sorry for the wait.`,
      ctaText: "View my orders",
    },
    orderCompleted: {
      heading: "You're all set — thanks for your order!",
      intro: ({ shopName }) =>
        `Your order from <strong>${shopName}</strong> is confirmed. Your invoice and receipt are attached to this email for your records.`,
      ctaText: "View my order",
    },
    newOrderReceived: {
      heading: "New order — action needed",
      intro: ({ amount }) =>
        `You've got a new order worth <strong>${amount}</strong>. Please accept or decline within the next 2 hours so your customer isn't left waiting.`,
      ctaText: "Review order",
    },
    orderExpiredSeller: {
      heading: "An order expired while awaiting your response",
      intro: () =>
        `One of your orders was automatically cancelled because it wasn't reviewed within the 2-hour window. Your customer has already been refunded — no action needed on your end.`,
      ctaText: "View my orders",
    },
    deliveryAssigned: {
      heading: "New delivery on your route",
      intro: ({ amount }) =>
        `You've been assigned a delivery worth <strong>${amount}</strong>. Head to the pickup point when you're ready to grab it.`,
      ctaText: "View delivery details",
    },
    hello: (name) => `Hi <strong>${name}</strong>,`,
    reason: `You're receiving this email because it relates to an order on ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
  fr: {
    paymentFailed: {
      heading: "Le paiement n'a pas pu être traité",
      intro: ({ shopName }) =>
        `Votre paiement pour la commande chez <strong>${shopName}</strong> n'a pas abouti. Aucun montant n'a été prélevé — vous pouvez réessayer dès que vous le souhaitez.`,
      ctaText: "Réessayer le paiement",
    },
    orderAccepted: {
      heading: "Bonne nouvelle — votre commande est confirmée",
      intro: ({ shopName }) =>
        `<strong>${shopName}</strong> a accepté votre commande et la prépare dès maintenant. Vous serez notifié dès qu'elle sera en route.`,
      ctaText: "Suivre ma commande",
    },
    orderRejected: {
      heading: "Votre commande n'a pas pu être honorée",
      intro: ({ shopName, reason }) =>
        reason
          ? `<strong>${shopName}</strong> n'a pas pu honorer cette commande. Raison indiquée : <em>${reason}</em>. Votre paiement a été intégralement remboursé.`
          : `<strong>${shopName}</strong> n'a pas pu honorer cette commande. Votre paiement a été intégralement remboursé.`,
      ctaText: "Voir mes commandes",
    },
    orderExpired: {
      heading: "Votre commande a expiré",
      intro: ({ shopName }) =>
        `<strong>${shopName}</strong> n'a pas répondu à temps, la commande a donc été annulée automatiquement. Votre paiement a été intégralement remboursé — désolé pour l'attente.`,
      ctaText: "Voir mes commandes",
    },
    orderCompleted: {
      heading: "C'est confirmé — merci pour votre commande !",
      intro: ({ shopName }) =>
        `Votre commande chez <strong>${shopName}</strong> est confirmée. Votre facture et votre reçu sont joints à cet e-mail.`,
      ctaText: "Voir ma commande",
    },
    newOrderReceived: {
      heading: "Nouvelle commande — action requise",
      intro: ({ amount }) =>
        `Vous avez reçu une nouvelle commande de <strong>${amount}</strong>. Merci de l'accepter ou de la refuser dans les 2 heures pour ne pas faire attendre votre client.`,
      ctaText: "Voir la commande",
    },
    orderExpiredSeller: {
      heading: "Une commande a expiré faute de réponse",
      intro: () =>
        `Une de vos commandes a été annulée automatiquement car elle n'a pas été traitée dans le délai de 2 heures. Le client a déjà été remboursé — aucune action requise de votre part.`,
      ctaText: "Voir mes commandes",
    },
    deliveryAssigned: {
      heading: "Nouvelle livraison sur votre trajet",
      intro: ({ amount }) =>
        `Une livraison de <strong>${amount}</strong> vous a été assignée. Rendez-vous au point de retrait dès que vous êtes prêt.`,
      ctaText: "Voir les détails de la livraison",
    },
    hello: (name) => `Bonjour <strong>${name}</strong>,`,
    reason: `Vous recevez cet e-mail car cela concerne une commande sur ${BRAND.name}.`,
    subjectPrefix: `${BRAND.name} —`,
  },
};

function orderStatusEmail(data) {
  const {
    name,
    action,
    shopName,
    amount,
    reason,
    actionUrl,
    locale = "en",
  } = data;
  const t = STATUS_CONTENT[locale] || STATUS_CONTENT.en;
  const content = t[action];
  if (!content) {
    throw new Error(`orderStatusEmail: unknown action "${action}"`);
  }

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0;">${content.intro({ shopName, amount, reason })}</p>
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

module.exports = { orderStatusEmail };
