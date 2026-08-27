const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
  en: {
    heading: "Approve a SwiftGoma expense",
    hello: (name) => `Hello, <strong>${name}</strong>.`,
    intro: (reference, title, amount, currency, vendor) =>
      `The expense <strong>${reference}</strong> — "${title}" — of <strong>${amount} ${currency}</strong> to <strong>${vendor}</strong> is awaiting your approval. Enter this code to trigger the PawaPay payment:`,
    expiry: (mins) =>
      `This code expires in ${mins} minutes. If you did not request this, contact support immediately.`,
    subject: (code) => `[${BRAND.name} Admin] Expense approval code: ${code}`,
    preheader: (reference, code) =>
      `Approve expense ${reference}: ${code}`,
    reason: `You're receiving this because a SwiftGoma expense is awaiting your approval in the admin dashboard.`,
  },
  fr: {
    heading: "Approuver une dépense SwiftGoma",
    hello: (name) => `Bonjour, <strong>${name}</strong>.`,
    intro: (reference, title, amount, currency, vendor) =>
      `La dépense <strong>${reference}</strong> — « ${title} » — de <strong>${amount} ${currency}</strong> au profit de <strong>${vendor}</strong> attend votre approbation. Saisissez ce code pour déclencher le paiement PawaPay :`,
    expiry: (mins) =>
      `Ce code expire dans ${mins} minutes. Si vous n'êtes pas à l'origine de cette demande, contactez le support immédiatement.`,
    subject: (code) =>
      `[${BRAND.name} Admin] Code d'approbation de dépense : ${code}`,
    preheader: (reference, code) =>
      `Approuver la dépense ${reference} : ${code}`,
    reason: `Vous recevez cet e-mail car une dépense SwiftGoma attend votre approbation dans l'administration.`,
  },
};

function adminExpenseOtpEmail(data) {
  const {
    name,
    code,
    expenseTitle,
    expenseReference,
    amount,
    currency,
    vendorName,
    expiresInMinutes,
    locale = "fr",
  } = data;
  const t = COPY[locale] || COPY.fr;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.hello(name)}
    </p>
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.intro(expenseReference, expenseTitle, amount, currency, vendorName)}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
      <tr>
        <td
          style="
            background-color: #f5f5f5;
            border-radius: 6px;
            padding: 16px 24px;
            font-family: 'Courier New', monospace;
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
    <p style="margin: 0; font-family: ${FONT_FAMILY}; color: #6b7280; font-size: 14px;">
      ${t.expiry(expiresInMinutes)}
    </p>
  `;

  return {
    subject: t.subject(code),
    html: renderEmailLayout({
      preheader: t.preheader(expenseReference, code),
      heading: t.heading,
      bodyHtml,
      reason: t.reason,
      locale,
    }),
  };
}

module.exports = { adminExpenseOtpEmail };
