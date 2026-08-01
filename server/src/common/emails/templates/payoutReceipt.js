const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const COPY = {
  en: {
    heading: "Payout sent",
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: "A payout has been sent from your wallet. Here's a summary:",
    amount: "Amount:",
    date: "Date:",
    method: "Sent to:",
    attached: "Your payout receipt is attached to this email as a PDF.",
    ctaText: "View wallet",
    subject: (documentNumber) =>
      `Your ${BRAND.name} payout receipt — ${documentNumber}`,
    preheader: (amount) =>
      `Payout of ${amount} sent to your mobile money account.`,
    reason: `You're receiving this because a payout was completed from your ${BRAND.name} seller wallet.`,
  },
  fr: {
    heading: "Payout envoyé",
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: "Un payout a été envoyé depuis votre wallet. Voici un résumé :",
    amount: "Montant :",
    date: "Date :",
    method: "Envoyé à :",
    attached: "Votre reçu de payout est joint à cet e-mail au format PDF.",
    ctaText: "Voir mon wallet",
    subject: (documentNumber) =>
      `Votre reçu de payout ${BRAND.name} — ${documentNumber}`,
    preheader: (amount) =>
      `Payout de ${amount} envoyé vers votre compte mobile money.`,
    reason: `Vous recevez cet e-mail car un payout a été effectué depuis votre wallet vendeur ${BRAND.name}.`,
  },
};

function payoutReceiptEmail(data) {
  const {
    name,
    documentNumber,
    amount,
    date,
    payoutPhoneNumber,
    walletUrl,
    receiptBuffer,
    receiptFilename = `${documentNumber}.pdf`,
    locale = "en",
  } = data;
  const t = COPY[locale] || COPY.en;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0;">${t.hello(name)}</p>
    <p style="margin: 0 0 16px 0;">${t.intro}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.amount}</strong> ${amount}</p>
    <p style="margin: 0 0 4px 0;"><strong>${t.date}</strong> ${date}</p>
    <p style="margin: 0 0 16px 0;"><strong>${t.method}</strong> ${payoutPhoneNumber}</p>
    <p style="margin: 0;">${t.attached}</p>
  `;

  const html = renderEmailLayout({
    preheader: t.preheader(amount),
    heading: t.heading,
    bodyHtml,
    cta: { text: t.ctaText, url: walletUrl },
    reason: t.reason,
    locale,
  });

  return {
    subject: t.subject(documentNumber),
    html,
    attachments: [
      {
        filename: receiptFilename,
        content: receiptBuffer,
        contentType: "application/pdf",
      },
    ],
  };
}

module.exports = { payoutReceiptEmail };
