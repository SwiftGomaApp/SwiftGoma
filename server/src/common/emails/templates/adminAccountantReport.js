const { renderEmailLayout } = require("../layout");
const { BRAND } = require("../../constants/brand");

const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function formatPeriodLabel(from, to) {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
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

  const periodLabel = formatPeriodLabel(report.period.from, report.period.to);
  const summary = report.summary;

  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      Bonjour,
    </p>
    <p style="margin: 0 0 16px 0; font-family: ${FONT_FAMILY};">
      Le rapport comptable SwiftGoma pour la période
      <strong>${periodLabel}</strong> est joint à cet e-mail (PDF).
      ${requestedBy ? `Demandé par <strong>${requestedBy}</strong>.` : ""}
    </p>
    <p style="margin: 0 0 8px 0; font-family: ${FONT_FAMILY};"><strong>Résumé :</strong></p>
    <ul style="margin: 0 0 16px 0; padding-left: 20px; font-family: ${FONT_FAMILY}; font-size: 14px; line-height: 1.6;">
      <li>Abonnements encaissés : ${formatCurrencySummary(summary.subscriptionRevenue)}</li>
      <li>Paiements commandes : ${formatCurrencySummary(summary.orderPayments)}</li>
      <li>GMV commandes complétées : ${formatCurrencySummary(summary.orderGmv)}</li>
      <li>Documents émis : ${summary.invoices.total}</li>
      <li>Paiements sortants admin : ${summary.adminPayouts.count}</li>
      <li>Retraits vendeurs : ${summary.sellerPayouts.count}</li>
    </ul>
    <p style="margin: 0; font-family: ${FONT_FAMILY}; color: #666;">
      Référence : <strong>${report.reference}</strong>
    </p>
  `;

  return {
    subject: `[${BRAND.name} Admin] Rapport comptable — ${report.reference}`,
    html: renderEmailLayout({
      preheader: `Rapport comptable ${periodLabel}`,
      heading: "Rapport comptable",
      bodyHtml,
      cta: adminUrl
        ? { text: "Ouvrir l'administration", url: adminUrl }
        : null,
      reason: `Vous recevez cet e-mail car vous êtes administrateur ${BRAND.name} ou destinataire configuré des rapports comptables.`,
      locale,
    }),
  };
}

module.exports = { adminAccountantReportEmail };
