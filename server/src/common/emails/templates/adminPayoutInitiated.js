const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
  en: {
    heading: "Manual payout submitted",
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: (providerLabel) =>
      `Your manual ${providerLabel} payout was approved and submitted successfully.`,
    amount: "Amount:",
    beneficiary: "Beneficiary:",
    phone: "Phone:",
    network: "Network:",
    provider: "Provider:",
    reference: "Reference:",
    status: "Status:",
    ctaText: "Open admin dashboard",
    subject: (providerLabel, amount, currency) =>
      `[${BRAND.name} Admin] ${providerLabel} payout submitted — ${amount} ${currency}`,
    preheader: (amount, currency) =>
      `Manual payout of ${amount} ${currency} submitted.`,
    reason: `You're receiving this because you approved a manual payout from the ${BRAND.name} admin dashboard.`,
  },
  fr: {
    heading: "Paiement sortant soumis",
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: (providerLabel) =>
      `Votre paiement sortant manuel ${providerLabel} a été approuvé et soumis avec succès.`,
    amount: "Montant :",
    beneficiary: "Bénéficiaire :",
    phone: "Téléphone :",
    network: "Réseau :",
    provider: "Fournisseur :",
    reference: "Référence :",
    status: "Statut :",
    ctaText: "Ouvrir l'administration",
    subject: (providerLabel, amount, currency) =>
      `[${BRAND.name} Admin] Paiement ${providerLabel} soumis — ${amount} ${currency}`,
    preheader: (amount, currency) =>
      `Paiement sortant manuel de ${amount} ${currency} soumis.`,
    reason: `Vous recevez cet e-mail car vous avez approuvé un paiement sortant manuel depuis l'administration ${BRAND.name}.`,
  },
};

function adminPayoutInitiatedEmail(data) {
  const {
    name,
    amount,
    currency,
    beneficiary,
    phoneNumber,
    network,
    providerName,
    providerLabel,
    externalId,
    externalStatus,
    adminUrl,
    locale = "fr",
  } = data;
  const t = COPY[locale] || COPY.fr;

  const detailRows = [
    `<p style="margin: 0 0 4px 0;"><strong>${t.amount}</strong> ${amount} ${currency}</p>`,
    beneficiary
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.beneficiary}</strong> ${beneficiary}</p>`
      : "",
    phoneNumber
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.phone}</strong> ${phoneNumber}</p>`
      : "",
    network
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.network}</strong> ${network}</p>`
      : "",
    providerName
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.provider}</strong> ${providerName}</p>`
      : "",
    externalId
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.reference}</strong> ${externalId}</p>`
      : "",
    externalStatus
      ? `<p style="margin: 0 0 4px 0;"><strong>${t.status}</strong> ${externalStatus}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.hello(name)}
    </p>
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.intro(providerLabel)}
    </p>
    ${detailRows}
  `;

  return {
    subject: t.subject(providerLabel, amount, currency),
    html: renderEmailLayout({
      preheader: t.preheader(amount, currency),
      heading: t.heading,
      bodyHtml,
      cta: adminUrl ? { text: t.ctaText, url: adminUrl } : null,
      reason: t.reason,
      locale,
    }),
  };
}

module.exports = { adminPayoutInitiatedEmail };
