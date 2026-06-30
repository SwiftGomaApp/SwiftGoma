const PDFDocument = require("pdfkit");
const axios = require("axios");
const path = require("path");

// ─── Brand ────────────────────────────────────────────────────────────────────

const ORANGE = "#ff8e00";
const WHITE = "#ffffff";
const DARK = "#111827";
const MUTED = "#6b7280";
const LIGHT = "#f9fafb";
const BORDER = "#e5e7eb";

const LOGO_URL =
  "https://res.cloudinary.com/dx3wclabo/image/upload/v1781951155/logo_default_rkbd8o.png";

const FONT_REGULAR = path.join(
  __dirname,
  "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
);
const FONT_BOLD = path.join(
  __dirname,
  "../../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf",
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fetchImageBuffer = async (url) => {
  const { data } = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(data);
};

const formatAmount = (amount, currency) =>
  currency === "USD"
    ? `$${Number(amount).toFixed(2)}`
    : `${Number(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} CDF`;

const formatDate = (date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const STATUS_LABELS = {
  DRAFT: "Brouillon",
  ISSUED: "Émise",
  PAID: "Payée",
  CANCELLED: "Annulée",
};
const STATUS_COLORS = {
  DRAFT: MUTED,
  ISSUED: "#2563eb",
  PAID: "#16a34a",
  CANCELLED: "#dc2626",
};

// ─── PDF Generator ────────────────────────────────────────────────────────────

const generateInvoicePdf = async (invoice, user) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `Facture ${invoice.invoiceNumber}`,
          Author: "SwiftGoma",
          Subject: "Facture SwiftGoma",
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont("Regular", FONT_REGULAR);
      doc.registerFont("Bold", FONT_BOLD);

      const W = 595.28;
      const M = 48;
      const CW = W - M * 2; // content width

      // ── Top orange accent strip ───────────────────────────────────────────
      doc.rect(0, 0, W, 5).fill(ORANGE);

      // ── Header: logo left + FACTURE right ────────────────────────────────
      // White background — logo black text will be clean

      let logoH = 26;
      let logoY = 18;

      try {
        const logoBuffer = await fetchImageBuffer(LOGO_URL);
        doc.image(logoBuffer, M, logoY, { height: logoH });
      } catch {
        doc
          .font("Bold")
          .fontSize(16)
          .fillColor(ORANGE)
          .text("SwiftGoma", M, logoY + 4);
      }

      // FACTURE label — top right
      doc
        .font("Bold")
        .fontSize(15)
        .fillColor(ORANGE)
        .text("FACTURE", 0, logoY + 6, { align: "right", width: W - M });

      // ── Invoice meta line ─────────────────────────────────────────────────
      const metaY = logoY + logoH + 36;

      // Left: from
      doc.font("Bold").fontSize(10).fillColor(DARK).text("SwiftGoma", M, metaY);
      doc
        .font("Regular")
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(
          "Goma, Nord-Kivu · République Démocratique du Congo",
          M,
          metaY + 14,
        )
        .text("info@swiftgoma.com · swiftgoma.com", M, metaY + 26);

      // Right: invoice details in a 2-col mini table
      const detY = metaY;
      const labelX = W / 2 + 10;
      const valueX = labelX + 110;

      const row = (label, value, y, highlight = false) => {
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(label, labelX, y);
        doc
          .font(highlight ? "Bold" : "Regular")
          .fontSize(8.5)
          .fillColor(highlight ? DARK : DARK)
          .text(value, valueX, y, { width: W - M - valueX, align: "right" });
      };

      row("N° Facture", invoice.invoiceNumber, detY, true);
      row(
        "Date d'émission",
        formatDate(invoice.issuedAt ?? new Date()),
        detY + 14,
      );
      if (invoice.paidAt) {
        row("Date de paiement", formatDate(invoice.paidAt), detY + 28);
      }

      // Status badge
      const statusColor = STATUS_COLORS[invoice.status] ?? MUTED;
      const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status;
      const badgeY = invoice.paidAt ? detY + 44 : detY + 30;
      const badgeW = 56;
      const badgeX = W - M - badgeW;
      doc.roundedRect(badgeX, badgeY, badgeW, 16, 3).fill(statusColor);
      doc
        .font("Bold")
        .fontSize(7)
        .fillColor(WHITE)
        .text(statusLabel.toUpperCase(), badgeX, badgeY + 4, {
          width: badgeW,
          align: "center",
        });

      // ── Divider ───────────────────────────────────────────────────────────
      const divY = metaY + 56;
      doc
        .moveTo(M, divY)
        .lineTo(W - M, divY)
        .lineWidth(0.75)
        .strokeColor(BORDER)
        .stroke();

      // ── Bill to ───────────────────────────────────────────────────────────
      const billY = divY + 18;
      doc
        .font("Bold")
        .fontSize(7.5)
        .fillColor(ORANGE)
        .text("FACTURER À", M, billY);
      doc
        .font("Bold")
        .fontSize(11)
        .fillColor(DARK)
        .text(user.name ?? "Client", M, billY + 12);
      let contactY = billY + 26;
      if (user.email) {
        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(MUTED)
          .text(user.email, M, contactY);
        contactY += 12;
      }
      if (user.phone) {
        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(MUTED)
          .text(user.phone, M, contactY);
      }

      // ── Table ─────────────────────────────────────────────────────────────
      const tableY = billY + 68;
      const colDesc = M;
      const colQty = M + CW * 0.55;
      const colPrice = M + CW * 0.72;
      const colTotal = M + CW * 0.85;
      const tableW = CW;
      const hRow = 30;
      const rowH = 42;
      const PAD = 10; // consistent horizontal padding

      // Header row — black background
      doc.rect(M, tableY, tableW, hRow).fill(DARK);
      doc.font("Bold").fontSize(8.5).fillColor(WHITE);
      doc.text("Description", colDesc + PAD, tableY + 10);
      doc.text("Qté", colQty, tableY + 10, { width: 44, align: "center" });
      doc.text("Prix unitaire", colPrice, tableY + 10, {
        width: 72,
        align: "right",
      });
      doc.text("Total", colTotal, tableY + 10, {
        width: W - M - colTotal - PAD,
        align: "right",
      });

      // Item rows
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      let rowY = tableY + hRow;

      items.forEach((item, i) => {
        const bg = i % 2 === 0 ? WHITE : LIGHT;
        doc.rect(M, rowY, tableW, rowH).fill(bg);

        doc
          .font("Bold")
          .fontSize(9)
          .fillColor(DARK)
          .text(item.description ?? "", colDesc + PAD, rowY + 9, {
            width: colQty - colDesc - PAD * 2,
          });

        if (item.note) {
          doc
            .font("Regular")
            .fontSize(7.5)
            .fillColor(MUTED)
            .text(item.note, colDesc + PAD, rowY + 22, {
              width: colQty - colDesc - PAD * 2,
            });
        }

        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(DARK)
          .text(String(item.quantity ?? 1), colQty, rowY + 15, {
            width: 44,
            align: "center",
          });

        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(DARK)
          .text(
            formatAmount(item.unitPrice ?? item.total, invoice.currency),
            colPrice,
            rowY + 15,
            { width: 72, align: "right" },
          );

        doc
          .font("Bold")
          .fontSize(9)
          .fillColor(DARK)
          .text(
            formatAmount(item.total, invoice.currency),
            colTotal,
            rowY + 15,
            { width: W - M - colTotal - PAD, align: "right" },
          );

        rowY += rowH;
      });

      // ── Total row — black background ──────────────────────────────────────
      const totalRowH = 38;
      const totalX = colPrice - 16;
      const totalW = W - M - totalX;

      doc.rect(totalX, rowY + 10, totalW, totalRowH).fill(DARK);
      doc
        .font("Bold")
        .fontSize(11)
        .fillColor(WHITE)
        .text("TOTAL", totalX + PAD, rowY + 21, { width: 70 });
      doc
        .font("Bold")
        .fontSize(13)
        .fillColor(WHITE)
        .text(
          formatAmount(invoice.amount, invoice.currency),
          totalX,
          rowY + 19,
          { width: totalW - PAD, align: "right" },
        );

      // ── Footer ────────────────────────────────────────────────────────────
      const footerH = 56;
      doc.rect(0, 841.89 - footerH, W, footerH).fill(DARK);
      doc
        .font("Regular")
        .fontSize(9)
        .fillColor(WHITE)
        .text(
          "Merci de votre confiance — SwiftGoma",
          M,
          841.89 - footerH + 14,
          { width: CW, align: "center" },
        );
      doc
        .font("Regular")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          "swiftgoma.com · info@swiftgoma.com · Goma, DRC",
          M,
          841.89 - footerH + 30,
          { width: CW, align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePdf };
