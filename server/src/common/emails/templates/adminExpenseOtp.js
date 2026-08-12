const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
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
    <div style="margin: 24px 0; text-align: center;">
      <span style="display: inline-block; font-family: ${FONT_FAMILY}; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${code}</span>
    </div>
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
