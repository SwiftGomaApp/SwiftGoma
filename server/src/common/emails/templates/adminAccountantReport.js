const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const COPY = {
  en: {
    heading: "Accountant report",
    hello: "Hello,",
    intro: (periodLabel, requestedBy) =>
      `The SwiftGoma accountant report for the period
      <strong>${periodLabel}</strong> is attached to this email (PDF).
      ${requestedBy ? `Requested by <strong>${requestedBy}</strong>.` : ""}`,
    summaryLabel: "Summary:",
    subscriptionRevenue: "Subscription revenue:",
    orderPayments: "Order payments:",
    orderGmv: "Completed order GMV:",
    invoicesIssued: "Documents issued:",
    adminPayouts: "Admin payouts:",
    sellerPayouts: "Seller withdrawals:",
    reference: "Reference:",
    ctaText: "Open admin dashboard",
    subject: (reference) => `[${BRAND.name} Admin] Accountant report — ${reference}`,
    preheader: (periodLabel) => `Accountant report ${periodLabel}`,
    reason: `You're receiving this because you're a ${BRAND.name} administrator or configured recipient for accountant reports.`,
  },
  fr: {
    heading: "Rapport comptable",
    hello: "Bonjour,",
    intro: (periodLabel, requestedBy) =>
      `Le rapport comptable SwiftGoma pour la période
      <strong>${periodLabel}</strong> est joint à cet e-mail (PDF).
      ${requestedBy ? `Demandé par <strong>${requestedBy}</strong>.` : ""}`,
    summaryLabel: "Résumé :",
    subscriptionRevenue: "Abonnements encaissés :",
    orderPayments: "Paiements commandes :",
    orderGmv: "GMV commandes complétées :",
    invoicesIssued: "Documents émis :",
    adminPayouts: "Paiements sortants admin :",
    sellerPayouts: "Retraits vendeurs :",
    reference: "Référence :",
    ctaText: "Ouvrir l'administration",
    subject: (reference) => `[${BRAND.name} Admin] Rapport comptable — ${reference}`,
    preheader: (periodLabel) => `Rapport comptable ${periodLabel}`,
    reason: `Vous recevez cet e-mail car vous êtes administrateur ${BRAND.name} ou destinataire configuré des rapports comptables.`,
  },
};

function formatPeriodLabel(from, to, locale) {
  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `${formatter.format(new Date(from))} → ${formatter.format(new Date(to))}`;
}

function formatCurrencySummary(totals = []) {
  if (!totals.length) return "—";
  return totals
    .map((row) => `${row.total} ${row.currency} (${row.count})`)
    .join(" · ");
}

function adminAccountantReportEmail(data) {
  const {
    report,
    requestedBy,
    adminUrl,
    locale = "fr",
  } = data;
  const t = COPY[locale] || COPY.fr;

  const periodLabel = formatPeriodLabel(
    report.period.from,
    report.period.to,
    locale,
  );
  const summary = report.summary;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.hello}
    </p>
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      ${t.intro(periodLabel, requestedBy)}
    </p>
    <p style="margin: 0 0 8px 0; font-family: ${FONT_FAMILY};"><strong>${t.summaryLabel}</strong></p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; font-family: ${FONT_FAMILY}; font-size: 14px; line-height: 1.6;">
      <li>${t.subscriptionRevenue} ${formatCurrencySummary(summary.subscriptionRevenue)}</li>
      <li>${t.orderPayments} ${formatCurrencySummary(summary.orderPayments)}</li>
      <li>${t.orderGmv} ${formatCurrencySummary(summary.orderGmv)}</li>
      <li>${t.invoicesIssued} ${summary.invoices.total}</li>
      <li>${t.adminPayouts} ${summary.adminPayouts.count}</li>
      <li>${t.sellerPayouts} ${summary.sellerPayouts.count}</li>
    </ul>
    <p style="margin: 0; font-family: ${FONT_FAMILY}; color: #666;">
      ${t.reference} <strong>${report.reference}</strong>
    </p>
  `;

  return {
    subject: t.subject(report.reference),
    html: renderEmailLayout({
      preheader: t.preheader(periodLabel),
      heading: t.heading,
      bodyHtml,
      cta: adminUrl ? { text: t.ctaText, url: adminUrl } : null,
      reason: t.reason,
      locale,
    }),
  };
}

module.exports = { adminAccountantReportEmail };
