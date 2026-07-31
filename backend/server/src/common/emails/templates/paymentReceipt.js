const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: "Payment received",
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: "We've received your payment. Here's a summary:",
    order: "Order:",
    amount: "Amount:",
    date: "Date:",
    method: "Payment method:",
    attached: "Your invoice is attached to this email as a PDF.",
    ctaText: "View order",
    subject: (orderId) => `Your ${BRAND.name} receipt — Order #${orderId}`,
    preheader: (orderId, amount) =>
      `Payment received for order #${orderId} — ${amount}.`,
    reason: `You're receiving this because a payment was completed on your ${BRAND.name} order.`,
  },
  fr: {
    heading: "Paiement reçu",
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: "Nous avons bien reçu votre paiement. Voici un résumé :",
    order: "Commande :",
    amount: "Montant :",
    date: "Date :",
    method: "Mode de paiement :",
    attached: "Votre facture est jointe à cet e-mail au format PDF.",
    ctaText: "Voir la commande",
    subject: (orderId) => `Votre reçu ${BRAND.name} — Commande n°${orderId}`,
    preheader: (orderId, amount) =>
      `Paiement reçu pour la commande n°${orderId} — ${amount}.`,
    reason: `Vous recevez cet e-mail car un paiement a été effectué sur votre commande ${BRAND.name}.`,
  },
};

function paymentReceiptEmail(data) {
  const {
    name,
    orderId,
    amount,
    date,
    paymentMethod,
    orderUrl,
    invoiceBuffer,
    invoiceFilename = `invoice-${orderId}.pdf`,
    locale = "en",
  } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 16px 0;">${t.intro}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.order}</strong> #${orderId}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.amount}</strong> ${amount}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.date}</strong> ${date}</p>
    <p style="margin: 0 0 16px 0;"><strong>${t.method}</strong> ${paymentMethod}</p>
    <p style="margin: 0;">${t.attached}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(orderId, amount),
    heading: t.heading,
    bodyHtml,
    cta: { text: t.ctaText, url: orderUrl },
    reason: t.reason,
    locale,
  });

  return {
    subject: t.subject(orderId),
    html,
    attachments: [
      {
        filename: invoiceFilename,
        content: invoiceBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

module.exports = { paymentReceiptEmail };
