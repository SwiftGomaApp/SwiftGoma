const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const STATUS_CONTENT = {
  en: {
    paymentFailed: {
      heading: "We couldn't confirm your payment",
      intro: ({ shopName, amount }) =>
        `We weren't able to confirm your payment for the order${amount ? ` of <strong>${amount}</strong>` : ""} at <strong>${shopName}</strong>. Nothing was charged to your account. Feel free to try again whenever you're ready — it only takes a minute.`,
      ctaText: "Retry payment",
    },
    orderAccepted: {
      heading: "Your order has been accepted",
      intro: ({ shopName, amount }) =>
        `<strong>${shopName}</strong> just accepted your order${amount ? ` of <strong>${amount}</strong>` : ""} and is getting it ready now. We'll notify you the moment it's on its way.`,
      ctaText: "Track my order",
    },
    orderRejected: {
      heading: "Your order couldn't be accepted",
      intro: ({ shopName, amount, reason }) =>
        reason
          ? `<strong>${shopName}</strong> wasn't able to fulfill your order${amount ? ` of <strong>${amount}</strong>` : ""}. Reason given: <em>${reason}</em>. No need to worry — you've been fully refunded and the money is already back on your account.`
          : `<strong>${shopName}</strong> wasn't able to fulfill your order${amount ? ` of <strong>${amount}</strong>` : ""}. No need to worry — you've been fully refunded.`,
      ctaText: "View my orders",
    },
    orderExpired: {
      heading: "Your order was cancelled automatically",
      intro: ({ shopName, amount }) =>
        `<strong>${shopName}</strong> didn't respond in time to your order${amount ? ` of <strong>${amount}</strong>` : ""}, so we cancelled it automatically and refunded you in full. Sorry for the wait — feel free to place a new order whenever you like.`,
      ctaText: "View my orders",
    },
    orderCompleted: {
      heading: "Order confirmed — thanks for shopping with us!",
      intro: ({ shopName, amount }) =>
        `Your order${amount ? ` of <strong>${amount}</strong>` : ""} at <strong>${shopName}</strong> is confirmed. Your invoice and receipt are attached to this email for your records.`,
      ctaText: "View my order",
    },
    newOrderReceived: {
      heading: "New order waiting for your response",
      intro: ({ amount }) =>
        `You've just received a new order worth <strong>${amount}</strong>. Please accept or decline it within the next 2 hours so your customer isn't left waiting.`,
      ctaText: "Review this order",
    },
    orderExpiredSeller: {
      heading: "An order expired without a response",
      intro: () =>
        `One of your orders was cancelled automatically because it wasn't reviewed within the 2-hour window, and the customer has already been refunded — no action needed on your end. Try to respond a little faster next time so you don't miss out on sales.`,
      ctaText: "View my orders",
    },
    deliveryAssigned: {
      heading: "New delivery assigned to you",
      intro: ({ amount }) =>
        `You've been assigned a delivery worth <strong>${amount}</strong>. Head to the pickup point whenever you're ready to grab it.`,
      ctaText: "View delivery details",
    },
    hello: (name) => `Hi <strong>${name}</strong>,`,
    reason: `You're receiving this email because it relates to an order on ${BRAND.name}.`,
  },
  fr: {
    paymentFailed: {
      heading: "Nous n'avons pas pu confirmer votre paiement",
      intro: ({ shopName, amount }) =>
        `Nous n'avons pas pu confirmer votre paiement pour la commande${amount ? ` de <strong>${amount}</strong>` : ""} chez <strong>${shopName}</strong>. Aucun montant n'a été débité de votre compte. Vous pouvez réessayer dès que vous êtes prêt — ça ne prend qu'une minute.`,
      ctaText: "Réessayer le paiement",
    },
    orderAccepted: {
      heading: "Votre commande a été acceptée",
      intro: ({ shopName, amount }) =>
        `<strong>${shopName}</strong> vient d'accepter votre commande${amount ? ` de <strong>${amount}</strong>` : ""} et se met à la préparer dès maintenant. Vous serez notifié dès qu'elle sera en route.`,
      ctaText: "Suivre ma commande",
    },
    orderRejected: {
      heading: "Votre commande n'a pas pu être acceptée",
      intro: ({ shopName, amount, reason }) =>
        reason
          ? `<strong>${shopName}</strong> n'a malheureusement pas pu honorer votre commande${amount ? ` de <strong>${amount}</strong>` : ""}. Motif indiqué : <em>${reason}</em>. Pas d'inquiétude : vous avez été intégralement remboursé et l'argent est déjà de retour sur votre compte.`
          : `<strong>${shopName}</strong> n'a malheureusement pas pu honorer votre commande${amount ? ` de <strong>${amount}</strong>` : ""}. Pas d'inquiétude : vous avez été intégralement remboursé.`,
      ctaText: "Voir mes commandes",
    },
    orderExpired: {
      heading: "Votre commande a été annulée automatiquement",
      intro: ({ shopName, amount }) =>
        `<strong>${shopName}</strong> n'a pas répondu à temps à votre commande${amount ? ` de <strong>${amount}</strong>` : ""}, nous l'avons donc annulée automatiquement et vous avez été intégralement remboursé. Désolé pour la gêne occasionnée — n'hésitez pas à repasser commande.`,
      ctaText: "Voir mes commandes",
    },
    orderCompleted: {
      heading: "Commande confirmée — merci pour votre confiance !",
      intro: ({ shopName, amount }) =>
        `Votre commande${amount ? ` de <strong>${amount}</strong>` : ""} chez <strong>${shopName}</strong> est bien confirmée. Votre facture et votre reçu sont joints à cet e-mail.`,
      ctaText: "Voir ma commande",
    },
    newOrderReceived: {
      heading: "Nouvelle commande à traiter",
      intro: ({ amount }) =>
        `Vous venez de recevoir une nouvelle commande de <strong>${amount}</strong>. Merci de l'accepter ou de la refuser dans les 2 prochaines heures pour ne pas faire attendre votre client.`,
      ctaText: "Traiter la commande",
    },
    orderExpiredSeller: {
      heading: "Une commande a expiré sans réponse de votre part",
      intro: () =>
        `Une de vos commandes a été annulée automatiquement car elle n'a pas été traitée dans le délai de 2 heures. Le client a déjà été remboursé, aucune action n'est requise de votre côté — pensez à répondre un peu plus vite la prochaine fois pour ne pas perdre de ventes.`,
      ctaText: "Voir mes commandes",
    },
    deliveryAssigned: {
      heading: "Nouvelle course qui vous a été assignée",
      intro: ({ amount }) =>
        `Une livraison de <strong>${amount}</strong> vous a été assignée. Rendez-vous au point de retrait dès que vous êtes prêt à la récupérer.`,
      ctaText: "Voir les détails de la course",
    },
    hello: (name) => `Bonjour <strong>${name}</strong>,`,
    reason: `Vous recevez cet e-mail car cela concerne une commande sur ${BRAND.name}.`,
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

  return { subject: `${BRAND.name} : ${content.heading}`, html };
}

module.exports = { orderStatusEmail };
