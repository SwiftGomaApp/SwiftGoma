const PDFDocument = require("pdfkit");
const axios = require("axios");
const { INVOICE_BRAND } = require("./pdfBrand");

let logoBufferPromise = null;
function getLogoBuffer() {
  if (!logoBufferPromise) {
    logoBufferPromise = axios
      .get(INVOICE_BRAND.logoUrl, { responseType: "arraybuffer" })
      .then((res) => Buffer.from(res.data))
      .catch((err) => {
        console.error("[invoicePdf] Failed to fetch logo:", err.message);
        logoBufferPromise = null;
        return null;
      });
  }
  return logoBufferPromise;
}

const PAGE_MARGIN = 50;
const PAGE_WIDTH = 612;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const FOOTER_RESERVE = 85;

function registerFonts(doc) {
  doc.registerFont("Geist", INVOICE_BRAND.fonts.regular);
  doc.registerFont("Geist-Medium", INVOICE_BRAND.fonts.medium);
  doc.registerFont("Geist-Bold", INVOICE_BRAND.fonts.bold);
}

function ensureSpace(doc, neededHeight) {
  if (doc.y + neededHeight > doc.page.height - FOOTER_RESERVE) {
    doc.addPage();
    registerFonts(doc);
    doc.y = PAGE_MARGIN;
  }
}

// function formatMoney(amount, currency) {
//   const num = Number(amount);

//   if (currency === "CDF") {
//     const rounded = Math.round(num);
//     const withSpaces = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
//     return `${withSpaces} ${currency}`;
//   }

//   return `${num.toFixed(2)} ${currency}`;
// }

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMoney(amount, currency) {
  const num = Number(amount);

  if (currency === "CDF") {
    const rounded = Math.round(num);
    const withDots = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots} ${currency}`;
  }

  return `${num.toFixed(2)} ${currency}`;
}

function drawHeader(doc, logoBuffer, title) {
  const logoWidth = 90;
  const titleY = PAGE_MARGIN;

  doc
    .fillColor(INVOICE_BRAND.colors.text)
    .fontSize(24)
    .font("Geist-Bold")
    .text(title, PAGE_MARGIN, titleY);

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, PAGE_WIDTH - PAGE_MARGIN - logoWidth, titleY - 5, {
        width: logoWidth,
        align: "right",
      });
    } catch (err) {
      console.error("[invoicePdf] Failed to embed logo:", err.message);
    }
  }

  doc.y = titleY + 50;
}

function drawMetaBlock(doc, rows) {
  const startY = doc.y;
  doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.text);

  rows.forEach(([label, value], i) => {
    const y = startY + i * 14;
    doc
      .font("Geist-Bold")
      .text(label, PAGE_MARGIN, y, { continued: false, width: 130 });
    doc.font("Geist").text(value, PAGE_MARGIN + 130, y);
  });

  doc.y = startY + rows.length * 14 + 16;
}

function drawPartiesBlock(doc, seller) {
  const startY = doc.y;
  const colWidth = CONTENT_WIDTH / 2 - 10;

  doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.text);
  doc.text(INVOICE_BRAND.name, PAGE_MARGIN, startY, { width: colWidth });
  doc.font("Geist").fillColor(INVOICE_BRAND.colors.muted);
  doc.text(INVOICE_BRAND.address.line1, { width: colWidth });
  doc.text(INVOICE_BRAND.address.line2, { width: colWidth });
  doc.text(INVOICE_BRAND.supportEmail, { width: colWidth });

  const leftEndY = doc.y;

  doc.y = startY;
  doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.text);
  doc.text("Facturé à", PAGE_MARGIN + colWidth + 20, startY, {
    width: colWidth,
  });
  doc.font("Geist").fillColor(INVOICE_BRAND.colors.muted);
  doc.text(seller.businessName, PAGE_MARGIN + colWidth + 20, doc.y, {
    width: colWidth,
  });
  doc.text(seller.address || "", { width: colWidth });
  doc.text(seller.contactEmail || "", { width: colWidth });

  doc.y = Math.max(leftEndY, doc.y) + 20;
}

function drawAmountHeadline(doc, label) {
  doc
    .fontSize(16)
    .font("Geist-Bold")
    .fillColor(INVOICE_BRAND.colors.text)
    .text(label, PAGE_MARGIN, doc.y);
  doc.moveDown(1);
}

function drawLineItemsTable(
  doc,
  { description, subDescription, quantity, unitPrice, amount, currency },
) {
  ensureSpace(doc, 60);

  const colDescX = PAGE_MARGIN;
  const colQtyX = PAGE_MARGIN + CONTENT_WIDTH - 220;
  const colUnitX = PAGE_MARGIN + CONTENT_WIDTH - 180;
  const colAmountX = PAGE_MARGIN + CONTENT_WIDTH - 100;

  const tableTop = doc.y;

  doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.muted);
  doc.text("Description", colDescX, tableTop);
  doc.text("Qté", colQtyX, tableTop, { width: 40, align: "right" });
  doc.text("Prix unit.", colUnitX, tableTop, { width: 80, align: "right" });
  doc.text("Montant", colAmountX, tableTop, { width: 100, align: "right" });

  doc
    .moveTo(colDescX, tableTop + 14)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, tableTop + 14)
    .strokeColor(INVOICE_BRAND.colors.text)
    .lineWidth(1)
    .stroke();

  const rowY = tableTop + 22;
  doc.fontSize(10).font("Geist").fillColor(INVOICE_BRAND.colors.text);
  doc.text(description, colDescX, rowY, { width: colQtyX - colDescX - 10 });
  if (subDescription) {
    doc
      .fontSize(9)
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(subDescription, colDescX, doc.y, {
        width: colQtyX - colDescX - 10,
      });
  }

  doc.fontSize(10).fillColor(INVOICE_BRAND.colors.text);
  doc.text(String(quantity), colQtyX, rowY, { width: 40, align: "right" });
  doc.text(formatMoney(unitPrice, currency), colUnitX, rowY, {
    width: 80,
    align: "right",
  });
  doc.text(formatMoney(amount, currency), colAmountX, rowY, {
    width: 100,
    align: "right",
  });

  doc.y = Math.max(doc.y, rowY + 20) + 10;
}

function drawTotalsBlock(doc, rows) {
  ensureSpace(doc, rows.length * 16 + 10);

  const totalsWidth = 220;
  const totalsX = PAGE_MARGIN + CONTENT_WIDTH - totalsWidth;
  const labelWidth = 140;

  rows.forEach(([label, value, bold], i) => {
    const y = doc.y;
    doc
      .fontSize(9)
      .font(bold ? "Geist-Bold" : "Geist")
      .fillColor(INVOICE_BRAND.colors.text)
      .text(label, totalsX, y, { width: labelWidth });
    doc.text(value, totalsX + labelWidth, y, {
      width: totalsWidth - labelWidth,
      align: "right",
    });
    doc.y = y + 16;
    if (bold) {
      doc
        .moveTo(totalsX, y - 4)
        .lineTo(totalsX + totalsWidth, y - 4)
        .strokeColor(INVOICE_BRAND.colors.border)
        .lineWidth(0.5)
        .stroke();
    }
  });

  doc.moveDown(1);
}

function drawFooter(doc) {
  const range = doc.bufferedPageRange();
  const originalHeight = doc.page.height;

  const contactsLine = `Airtel: ${INVOICE_BRAND.contacts.airtel}  |  Orange: ${INVOICE_BRAND.contacts.orange}  |  Vodacom: ${INVOICE_BRAND.contacts.vodacom}`;
  const brandLine = `${INVOICE_BRAND.name} — ${INVOICE_BRAND.supportEmail} — ${INVOICE_BRAND.website}`;

  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);

    const lineY = originalHeight - 95;

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
      .text(brandLine, PAGE_MARGIN, lineY + 12, {
        width: CONTENT_WIDTH / 2,
        lineBreak: false,
      });

    doc
      .fontSize(8)
      .font("Geist")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(
        `Page ${i + 1} sur ${range.count}`,
        PAGE_MARGIN + CONTENT_WIDTH / 2,
        lineY + 12,
        { width: CONTENT_WIDTH / 2, align: "right", lineBreak: false },
      );

    doc
      .fontSize(8)
      .font("Geist")
      .fillColor(INVOICE_BRAND.colors.muted)
      .text(contactsLine, PAGE_MARGIN, lineY + 28, {
        width: CONTENT_WIDTH,
        lineBreak: false,
      });
  }
}

async function generateInvoicePdf(data) {
  const {
    documentNumber,
    issuedAt,
    seller,
    planName,
    periodLabel,
    quantity = 1,
    unitPrice,
    amount,
    currency,
  } = data;

  const logoBuffer = await getLogoBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    registerFonts(doc);

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(doc, logoBuffer, "Facture");

    drawMetaBlock(doc, [
      ["Numéro de facture", documentNumber],
      ["Date d'émission", formatDate(issuedAt)],
    ]);

    drawPartiesBlock(doc, seller);

    drawAmountHeadline(doc, `${formatMoney(amount, currency)} dû`);

    drawLineItemsTable(doc, {
      description: `Abonnement ${planName}`,
      subDescription: periodLabel,
      quantity,
      unitPrice,
      amount,
      currency,
    });

    drawTotalsBlock(doc, [
      ["Sous-total", formatMoney(amount, currency)],
      ["Total dû", formatMoney(amount, currency), true],
    ]);

    drawFooter(doc);
    doc.end();
  });
}

async function generateReceiptPdf(data) {
  const {
    documentNumber,
    invoiceNumber,
    paidAt,
    seller,
    planName,
    periodLabel,
    quantity = 1,
    unitPrice,
    amount,
    currency,
    paymentMethod,
  } = data;

  const logoBuffer = await getLogoBuffer();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    registerFonts(doc);

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(doc, logoBuffer, "Reçu");

    drawMetaBlock(doc, [
      ["Numéro de facture", invoiceNumber],
      ["Numéro de reçu", documentNumber],
      ["Date de paiement", formatDate(paidAt)],
    ]);

    drawPartiesBlock(doc, seller);

    drawAmountHeadline(
      doc,
      `${formatMoney(amount, currency)} payé le ${formatDate(paidAt)}`,
    );

    drawLineItemsTable(doc, {
      description: `Abonnement ${planName}`,
      subDescription: periodLabel,
      quantity,
      unitPrice,
      amount,
      currency,
    });

    drawTotalsBlock(doc, [
      ["Sous-total", formatMoney(amount, currency)],
      ["Total", formatMoney(amount, currency)],
      ["Montant payé", formatMoney(amount, currency), true],
    ]);

    ensureSpace(doc, 70);

    doc
      .fontSize(11)
      .font("Geist-Bold")
      .fillColor(INVOICE_BRAND.colors.text)
      .text("Historique de paiement", PAGE_MARGIN, doc.y);
    doc.moveDown(0.5);

    const histY = doc.y;
    doc.fontSize(9).font("Geist-Bold").fillColor(INVOICE_BRAND.colors.muted);
    doc.text("Méthode de paiement", PAGE_MARGIN, histY, { width: 180 });
    doc.text("Date", PAGE_MARGIN + 180, histY, { width: 100 });
    doc.text("Montant payé", PAGE_MARGIN + 280, histY, {
      width: 90,
      align: "right",
    });
    doc.text("N° de reçu", PAGE_MARGIN + 370, histY, {
      width: 100,
      align: "right",
    });

    doc.fontSize(9).font("Geist").fillColor(INVOICE_BRAND.colors.text);
    const rowY = histY + 16;
    doc.text(paymentMethod, PAGE_MARGIN, rowY, { width: 180 });
    doc.text(formatDate(paidAt), PAGE_MARGIN + 180, rowY, { width: 100 });
    doc.text(formatMoney(amount, currency), PAGE_MARGIN + 280, rowY, {
      width: 90,
      align: "right",
    });
    doc.text(documentNumber, PAGE_MARGIN + 370, rowY, {
      width: 100,
      align: "right",
    });

    doc.y = rowY + 30;

    drawFooter(doc);
    doc.end();
  });
}

module.exports = { generateInvoicePdf, generateReceiptPdf };
