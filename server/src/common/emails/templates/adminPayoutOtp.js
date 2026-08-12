const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
  en: {
    heading: "Approve manual payout",
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: (providerLabel, amount, currency, beneficiary) =>
      `A manual ${providerLabel} payout of <strong>${amount} ${currency}</strong> to <strong>${beneficiary}</strong> was requested from the admin dashboard. Enter this code to approve it:`,
    expiry: (mins) =>
      `This code expires in ${mins} minutes. If you did not request this payout, contact support immediately.`,
    subject: (code) => `[${BRAND.name} Admin] Payout approval code: ${code}`,
    preheader: (providerLabel, code) =>
      `Approve ${providerLabel} payout: ${code}`,
    reason: `You're receiving this because a manual payout approval was requested from the ${BRAND.name} admin dashboard.`,
  },
  fr: {
    heading: "Approuver le paiement sortant",
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: (providerLabel, amount, currency, beneficiary) =>
      `Un paiement sortant manuel ${providerLabel} de <strong>${amount} ${currency}</strong> vers <strong>${beneficiary}</strong> a été demandé depuis l'administration. Saisissez ce code pour l'approuver :`,
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Si vous n'êtes pas à l'origine de cette demande, contactez le support immédiatement.`,
    subject: (code) =>
      `[${BRAND.name} Admin] Code d'approbation de paiement : ${code}`,
    preheader: (providerLabel, code) =>
      `Approuver le paiement ${providerLabel} : ${code}`,
    reason: `Vous recevez cet e-mail car une approbation de paiement sortant a été demandée depuis l'administration ${BRAND.name}.`,
  },
};

function adminPayoutOtpEmail(data) {
  const {
    name,
    code,
    amount,
    currency,
    beneficiary,
    providerLabel = "MbiyoPay",
    expiresInMinutes,
    locale = "fr",
  } = data;
  const t = COPY[locale] || COPY.fr;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.hello(name)}
    </p>
    <p style="margin: 0 0 24px 0; font-family: ${FONT_FAMILY};">
      ${t.intro(providerLabel, amount, currency, beneficiary)}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td
          style="
            background-color: #f5f5f5;
            border-radius: 6px;
            padding: 16px 24px;
            font-family: ${FONT_FAMILY};
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: ${BRAND.colors.text};
          "
        >
          ${code}
        </td>
      </tr>
    </table>
    <p style="margin: 0; font-family: ${FONT_FAMILY}; color: ${BRAND.colors.muted};">
      ${t.expiry(expiresInMinutes)}
    </p>
  `;

  return {
    subject: t.subject(code),
    html: renderEmailLayout({
      preheader: t.preheader(providerLabel, code),
      heading: t.heading,
      bodyHtml,
      reason: t.reason,
      locale,
    }),
  };
}

module.exports = { adminPayoutOtpEmail };
