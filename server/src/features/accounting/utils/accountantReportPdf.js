const PDFDocument = require("pdfkit");
const axios = require("axios");
const { INVOICE_BRAND } = require("../../invoicing/utils/pdfBrand");

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_BLOCK_HEIGHT = 36;
const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN - FOOTER_BLOCK_HEIGHT;
const COL_GAP = 10;

let logoBufferPromise = null;

function getLogoBuffer() {
  if (!logoBufferPromise) {
    logoBufferPromise = axios
      .get(INVOICE_BRAND.logoUrl, { responseType: "arraybuffer" })
      .then((res) => Buffer.from(res.data))
      .catch(() => null);
  }
  return logoBufferPromise;
}

function registerFonts(doc) {
  doc.registerFont("Geist", INVOICE_BRAND.fonts.regular);
  doc.registerFont("Geist-Medium", INVOICE_BRAND.fonts.medium);
  doc.registerFont("Geist-Bold", INVOICE_BRAND.fonts.bold);
}

function createLayout(doc) {
  let y = PAGE_MARGIN;

  function sync() {
    doc.y = y;
  }

  function ensureSpace(neededHeight) {
    if (y + neededHeight > CONTENT_BOTTOM) {
      doc.addPage();
      registerFonts(doc);
      y = PAGE_MARGIN;
      sync();
    }
  }

  function advance(delta) {
    y += delta;
    sync();
  }

  function set(nextY) {
    y = nextY;
    sync();
  }

  function textBlock(text, x, textY, options = {}) {
    doc.text(String(text ?? "—"), x, textY, {
      lineBreak: false,
      ...options,
    });
    doc.y = textY;
  }

  return { get y() { return y; }, ensureSpace, advance, set, textBlock, sync };
}

function truncateText(text, maxLength = 56) {
  const normalized = String(text ?? "—").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(date) {
  return new Date(date).toLocaleString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(amount, currency) {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "—";
  if (currency === "CDF") {
    const withDots = String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots} ${currency}`;
  }
  return `${num.toFixed(2)} ${currency}`;
}

function layoutColumns(specs) {
  const fixedWidth = specs.reduce((sum, col) => sum + (col.width || 0), 0);
  const flexible = specs.filter((col) => !col.width);
  const gaps = COL_GAP * Math.max(specs.length - 1, 0);
  const remaining = CONTENT_WIDTH - fixedWidth - gaps;
  const weightTotal = flexible.reduce((sum, col) => sum + (col.weight || 1), 0);

  let x = PAGE_MARGIN;
  return specs.map((col, index) => {
    const width =
      col.width ||
      Math.max(40, Math.floor((remaining * (col.weight || 1)) / weightTotal));
    const positioned = { ...col, x, width };
    x += width + (index < specs.length - 1 ? COL_GAP : 0);
    return positioned;
  });
}

function drawHeader(layout, doc, logoBuffer, title, subtitle) {
  const logoWidth = 90;
  const titleY = PAGE_MARGIN;

  doc
    .fillColor(INVOICE_BRAND.colors.text)
    .fontSize(22)
    .font("Geist-Bold")
    .text(title, PAGE_MARGIN, titleY, {
      width: CONTENT_WIDTH - logoWidth - 12,
      lineBreak: false,
    });

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, PAGE_WIDTH - PAGE_MARGIN - logoWidth, titleY - 5, {
        width: logoWidth,
      });
    } catch {

    }
  }

  doc
    .fontSize(10)
    .font("Geist")
    .fillColor(INVOICE_BRAND.colors.muted)
    .text(subtitle, PAGE_MARGIN, titleY + 34, {
      width: CONTENT_WIDTH,
      lineBreak: false,
    });

  layout.set(titleY + 58);
}

function drawSectionTitle(layout, doc, title) {
  layout.ensureSpace(26);
  const top = layout.y;

  doc
    .fontSize(11)
    .font("Geist-Bold")
    .fillColor(INVOICE_BRAND.colors.text)
    .text(title, PAGE_MARGIN, top, { width: CONTENT_WIDTH, lineBreak: false });

  doc
    .moveTo(PAGE_MARGIN, top + 16)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, top + 16)
    .strokeColor(INVOICE_BRAND.colors.border)
    .lineWidth(0.8)
    .stroke();

  layout.set(top + 22);
}

function drawKeyValueRows(layout, doc, rows) {
  layout.ensureSpace(rows.length * 16 + 8);
  const startY = layout.y;

  rows.forEach(([label, value], index) => {
    const rowY = startY + index * 16;
    doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.text);
    doc.text(label, PAGE_MARGIN, rowY, { width: 130, lineBreak: false });
    doc
      .font("Geist")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(String(value ?? "—"), PAGE_MARGIN + 135, rowY, {
        width: CONTENT_WIDTH - 135,
        lineBreak: false,
      });
  });

  layout.set(startY + rows.length * 16 + 8);
}

function drawSummaryCards(layout, doc, cards) {
  const cardWidth = (CONTENT_WIDTH - COL_GAP) / 2;
  const cardHeight = 50;
  const rows = Math.ceil(cards.length / 2);
  const totalHeight = rows * cardHeight + Math.max(rows - 1, 0) * COL_GAP + 8;

  layout.ensureSpace(totalHeight);
  const startY = layout.y;

  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = PAGE_MARGIN + col * (cardWidth + COL_GAP);
    const y = startY + row * (cardHeight + COL_GAP);

    doc
      .roundedRect(x, y, cardWidth, cardHeight, 6)
      .lineWidth(0.8)
      .strokeColor(INVOICE_BRAND.colors.border)
      .stroke();

    doc
      .fontSize(8)
      .font("Geist-Medium")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(card.label, x + 10, y + 8, {
        width: cardWidth - 20,
        lineBreak: false,
      });

    doc
      .fontSize(10)
      .font("Geist-Bold")
      .fillColor(INVOICE_BRAND.colors.text)
      .text(truncateText(card.value, 42), x + 10, y + 24, {
        width: cardWidth - 20,
        lineBreak: false,
      });

    doc.y = y;
  });

  layout.set(startY + totalHeight);
}

function drawTable(
  layout,
  doc,
  columnSpecs,
  rows,
  emptyLabel = "Aucune donnée sur cette période.",
) {
  const columns = layoutColumns(columnSpecs);
  const headerHeight = 14;
  const emptyHeight = 18;
  const rowHeight = 14;
  const tableHeight = rows.length
    ? headerHeight + 8 + rows.length * rowHeight
    : headerHeight + emptyHeight;

  layout.ensureSpace(tableHeight + 6);
  const tableTop = layout.y;

  doc.fontSize(8).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.muted);
  columns.forEach((col) => {
    doc.text(col.label, col.x, tableTop, {
      width: col.width,
      align: col.align || "left",
      lineBreak: false,
    });
  });

  doc
    .moveTo(PAGE_MARGIN, tableTop + headerHeight)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, tableTop + headerHeight)
    .strokeColor(INVOICE_BRAND.colors.border)
    .lineWidth(0.8)
    .stroke();

  if (!rows.length) {
    doc
      .fontSize(8.5)
      .font("Geist")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(emptyLabel, PAGE_MARGIN, tableTop + headerHeight + 6, {
        width: CONTENT_WIDTH,
        lineBreak: false,
      });
    layout.set(tableTop + headerHeight + emptyHeight + 4);
    return;
  }

  let rowY = tableTop + headerHeight + 8;
  rows.forEach((row) => {
    layout.ensureSpace(rowHeight + 4);
    if (rowY < layout.y) rowY = layout.y;

    doc.fontSize(8.5).font("Geist").fillColor(INVOICE_BRAND.colors.text);
    columns.forEach((col, colIndex) => {
      doc.text(truncateText(row[colIndex], 40), col.x, rowY, {
        width: col.width,
        align: col.align || "left",
        lineBreak: false,
      });
    });

    rowY += rowHeight;
  });

  layout.set(rowY + 4);
}

function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  const brandLine = `${INVOICE_BRAND.name} — ${INVOICE_BRAND.supportEmail} — ${INVOICE_BRAND.website}`;
  const lineY = CONTENT_BOTTOM + 8;
  const textY = lineY + 10;

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.x = PAGE_MARGIN;
    doc.y = textY;

    doc
      .moveTo(PAGE_MARGIN, lineY)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY)
      .strokeColor(INVOICE_BRAND.colors.border)
      .lineWidth(0.5)
      .stroke();

    doc
      .fontSize(8)
      .font("Geist")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(brandLine, PAGE_MARGIN, textY, {
        width: CONTENT_WIDTH / 2,
        lineBreak: false,
      });

    doc.text(`Page ${i + 1} sur ${range.count}`, PAGE_MARGIN, textY, {
      width: CONTENT_WIDTH,
      align: "right",
      lineBreak: false,
    });

    doc.y = textY;
  }
}

function buildCurrencySummaryLines(totals) {
  if (!totals?.length) return "Aucun";
  return totals
    .map(
      (row) =>
        `${formatMoney(row.total, row.currency)} (${row.count} op.)`,
    )
    .join(" · ");
}

function buildCountSummary(count, totals) {
  if (!count) return "0";
  if (!totals?.length) return `${count} opération${count === 1 ? "" : "s"}`;
  return `${count} op. · ${buildCurrencySummaryLines(totals)}`;
}

async function generateAccountantReportPdf(report) {
  const logoBuffer = await getLogoBuffer();
  const invoices = report.summary.invoices;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    registerFonts(doc);
    const layout = createLayout(doc);

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(
      layout,
      doc,
      logoBuffer,
      "Rapport comptable",
      `Période : ${formatDate(report.period.from)} → ${formatDate(report.period.to)}`,
    );

    drawKeyValueRows(layout, doc, [
      ["Généré le", formatDateTime(report.generatedAt)],
      ["Référence", report.reference],
      ["Demandé par", report.requestedBy || "Système"],
    ]);

    drawSectionTitle(layout, doc, "Résumé exécutif");
    drawSummaryCards(layout, doc, [
      {
        label: "Abonnements encaissés",
        value: buildCurrencySummaryLines(report.summary.subscriptionRevenue),
      },
      {
        label: "Paiements commandes",
        value: buildCurrencySummaryLines(report.summary.orderPayments),
      },
      {
        label: "GMV commandes complétées",
        value: buildCurrencySummaryLines(report.summary.orderGmv),
      },
      {
        label: "Documents émis",
        value: `${invoices.total} · ${invoices.INVOICE} fact. · ${invoices.RECEIPT} reçus · ${invoices.PAYOUT_RECEIPT} payout`,
      },
      {
        label: "Paiements sortants admin",
        value: buildCountSummary(
          report.summary.adminPayouts.count,
          report.summary.adminPayouts.totals,
        ),
      },
      {
        label: "Retraits vendeurs",
        value: buildCountSummary(
          report.summary.sellerPayouts.count,
          report.summary.sellerPayouts.totals,
        ),
      },
      {
        label: "Dépenses SwiftGoma",
        value: `${report.summary.companyExpenses.count} · ${report.summary.companyExpenses.pending} en attente · ${buildCurrencySummaryLines(report.summary.companyExpenses.totals)}`,
      },
    ]);

    drawSectionTitle(layout, doc, "Abonnements encaissés");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Vendeur", weight: 2 },
        { label: "Plan", weight: 1.2 },
        { label: "Montant", width: 78, align: "right" },
        { label: "Statut", width: 64 },
      ],
      report.details.subscriptionPayments.map((row) => [
        formatDate(row.paidAt),
        row.businessName,
        row.planName,
        formatMoney(row.amount, row.currency),
        row.status,
      ]),
    );

    drawSectionTitle(layout, doc, "Paiements commandes (MbiyoPay)");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Commande", width: 72 },
        { label: "Montant", width: 78, align: "right" },
        { label: "Réseau", width: 72 },
        { label: "Statut", weight: 1 },
      ],
      report.details.orderPayments.map((row) => [
        formatDate(row.createdAt),
        row.orderId.slice(0, 8),
        formatMoney(row.amount, row.currency),
        row.network || "—",
        row.status,
      ]),
    );

    drawSectionTitle(layout, doc, "Commandes complétées (GMV)");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Commande", width: 72 },
        { label: "Boutique", weight: 2 },
        { label: "Montant", width: 88, align: "right" },
      ],
      report.details.completedOrders.map((row) => [
        formatDate(row.completedAt),
        row.id.slice(0, 8),
        row.shopName,
        formatMoney(row.total, row.currency),
      ]),
    );

    drawSectionTitle(layout, doc, "Paiements sortants admin");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Fourn.", width: 52 },
        { label: "Bénéficiaire", weight: 2 },
        { label: "Montant", width: 78, align: "right" },
        { label: "Statut", width: 64 },
        { label: "Réf.", width: 52 },
      ],
      report.details.adminPayouts.map((row) => [
        formatDate(row.createdAt),
        row.provider,
        row.beneficiary || row.phoneNumber || "—",
        formatMoney(row.amount, row.currency),
        row.status,
        row.externalId ? row.externalId.slice(0, 8) : "—",
      ]),
    );

    drawSectionTitle(layout, doc, "Retraits vendeurs");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Vendeur", weight: 2 },
        { label: "Montant", width: 78, align: "right" },
        { label: "Statut", width: 64 },
        { label: "Téléphone", weight: 1.2 },
      ],
      report.details.sellerPayouts.map((row) => [
        formatDate(row.createdAt),
        row.businessName,
        formatMoney(row.amount, row.currency),
        row.status,
        row.payoutPhone || "—",
      ]),
    );

    drawSectionTitle(layout, doc, "Dépenses SwiftGoma");
    drawTable(
      layout,
      doc,
      [
        { label: "Date", width: 72 },
        { label: "Réf.", width: 68 },
        { label: "Titre", weight: 1.6 },
        { label: "Catégorie", width: 64 },
        { label: "Bénéficiaire", weight: 1.2 },
        { label: "Montant", width: 78, align: "right" },
        { label: "Statut", width: 64 },
      ],
      report.details.companyExpenses.map((row) => [
        formatDate(row.incurredAt),
        row.reference.replace("EXP-", ""),
        row.title,
        row.category,
        row.vendorName,
        formatMoney(row.amount, row.currency),
        row.status,
      ]),
    );

    if (report.truncated) {
      layout.ensureSpace(16);
      doc
        .fontSize(8)
        .font("Geist")
        .fillColor(INVOICE_BRAND.colors.muted)
        .text(
          "Certaines sections sont limitées aux 100 dernières opérations de la période.",
          PAGE_MARGIN,
          layout.y,
          { width: CONTENT_WIDTH, lineBreak: false },
        );
      layout.advance(14);
    }

    drawFooter(doc);
    doc.end();
  });
}

module.exports = { generateAccountantReportPdf };
