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
const GREEN = "#16a34a";

const LOGO_URL =
  "https://res.cloudinary.com/dx3wclabo/image/upload/v1781951155/logo_default_rkbd8o.png";

const FONT_REGULAR = path.join(
  __dirname,
  "../../../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf",
);
const FONT_BOLD = path.join(
  __dirname,
  "../../../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf",
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

// ─── Order Confirmation PDF ───────────────────────────────────────────────────

const generateOrderConfirmationPdf = async (order, buyer, shop) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: `Confirmation ${order.orderNumber}`,
          Author: "SwiftGoma",
          Subject: "Confirmation de commande SwiftGoma",
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
      const CW = W - M * 2;

      // ── Top orange accent strip ───────────────────────────────────────────
      doc.rect(0, 0, W, 5).fill(ORANGE);

      // ── Header ────────────────────────────────────────────────────────────
      let logoY = 18;
      try {
        const logoBuffer = await fetchImageBuffer(LOGO_URL);
        doc.image(logoBuffer, M, logoY, { height: 26 });
      } catch {
        doc
          .font("Bold")
          .fontSize(16)
          .fillColor(ORANGE)
          .text("SwiftGoma", M, logoY + 4);
      }

      doc
        .font("Bold")
        .fontSize(15)
        .fillColor(ORANGE)
        .text("CONFIRMATION DE COMMANDE", 0, logoY + 6, {
          align: "right",
          width: W - M,
        });

      // ── Order meta ────────────────────────────────────────────────────────
      const metaY = logoY + 26 + 32;

      // Left: SwiftGoma info
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

      // Right: order details
      const labelX = W / 2 + 10;
      const valueX = labelX + 110;

      const detRow = (label, value, y, bold = false) => {
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(label, labelX, y);
        doc
          .font(bold ? "Bold" : "Regular")
          .fontSize(8.5)
          .fillColor(DARK)
          .text(value, valueX, y, { width: W - M - valueX, align: "right" });
      };

      detRow("N° Commande", order.orderNumber, metaY, true);
      detRow("Date", formatDate(order.createdAt), metaY + 14);
      detRow(
        "Mode de paiement",
        order.paymentMethod === "MOBILE_MONEY"
          ? "Mobile Money"
          : "Paiement à la livraison",
        metaY + 28,
      );

      // Status badge
      doc.roundedRect(W - M - 80, metaY + 44, 80, 16, 3).fill(GREEN);
      doc
        .font("Bold")
        .fontSize(7)
        .fillColor(WHITE)
        .text("CONFIRMÉE", W - M - 80, metaY + 48, {
          width: 80,
          align: "center",
        });

      // ── Divider ───────────────────────────────────────────────────────────
      const divY = metaY + 72;
      doc
        .moveTo(M, divY)
        .lineTo(W - M, divY)
        .lineWidth(0.75)
        .strokeColor(BORDER)
        .stroke();

      // ── Bill to + Delivery address ────────────────────────────────────────
      const infoY = divY + 18;

      // Left: buyer info
      doc
        .font("Bold")
        .fontSize(7.5)
        .fillColor(ORANGE)
        .text("ACHETEUR", M, infoY);
      doc
        .font("Bold")
        .fontSize(10)
        .fillColor(DARK)
        .text(buyer.name ?? "Client", M, infoY + 12);
      if (buyer.email) {
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(buyer.email, M, infoY + 24);
      }
      if (buyer.phone) {
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(buyer.phone, M, infoY + 36);
      }

      // Right: delivery address
      const rightX = W / 2 + 10;
      doc
        .font("Bold")
        .fontSize(7.5)
        .fillColor(ORANGE)
        .text("ADRESSE DE LIVRAISON", rightX, infoY);
      doc
        .font("Regular")
        .fontSize(8.5)
        .fillColor(DARK)
        .text(
          [order.avenue, order.quartier, order.commune]
            .filter(Boolean)
            .join(", "),
          rightX,
          infoY + 12,
          { width: W - M - rightX },
        );
      if (order.reference) {
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(MUTED)
          .text(`Réf: ${order.reference}`, rightX, infoY + 24, {
            width: W - M - rightX,
          });
      }

      // Shop info
      doc
        .font("Bold")
        .fontSize(7.5)
        .fillColor(ORANGE)
        .text("BOUTIQUE", rightX, infoY + 40);
      doc
        .font("Regular")
        .fontSize(8.5)
        .fillColor(DARK)
        .text(shop?.name ?? "Boutique", rightX, infoY + 52, {
          width: W - M - rightX,
        });

      // ── Items table ───────────────────────────────────────────────────────
      const tableY = infoY + 84;
      const colDesc = M;
      const colQty = M + CW * 0.55;
      const colPrice = M + CW * 0.72;
      const colTotal = M + CW * 0.85;
      const PAD = 10;
      const hRow = 30;
      const rowH = 40;

      // Header
      doc.rect(M, tableY, CW, hRow).fill(DARK);
      doc.font("Bold").fontSize(8.5).fillColor(WHITE);
      doc.text("Article", colDesc + PAD, tableY + 10);
      doc.text("Qté", colQty, tableY + 10, { width: 44, align: "center" });
      doc.text("Prix unitaire", colPrice, tableY + 10, {
        width: 72,
        align: "right",
      });
      doc.text("Total", colTotal, tableY + 10, {
        width: W - M - colTotal - PAD,
        align: "right",
      });

      // Items
      const items = Array.isArray(order.items) ? order.items : [];
      let rowY = tableY + hRow;

      items.forEach((item, i) => {
        doc.rect(M, rowY, CW, rowH).fill(i % 2 === 0 ? WHITE : LIGHT);

        doc
          .font("Bold")
          .fontSize(9)
          .fillColor(DARK)
          .text(item.name, colDesc + PAD, rowY + 9, {
            width: colQty - colDesc - PAD * 2,
          });
        if (item.variantName) {
          doc
            .font("Regular")
            .fontSize(7.5)
            .fillColor(MUTED)
            .text(item.variantName, colDesc + PAD, rowY + 22, {
              width: colQty - colDesc - PAD * 2,
            });
        }

        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(DARK)
          .text(String(item.quantity), colQty, rowY + 15, {
            width: 44,
            align: "center",
          });

        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(DARK)
          .text(formatAmount(item.price, order.currency), colPrice, rowY + 15, {
            width: 72,
            align: "right",
          });

        doc
          .font("Bold")
          .fontSize(9)
          .fillColor(DARK)
          .text(formatAmount(item.total, order.currency), colTotal, rowY + 15, {
            width: W - M - colTotal - PAD,
            align: "right",
          });

        rowY += rowH;
      });

      // ── Totals ────────────────────────────────────────────────────────────
      rowY += 8;

      if (order.deliveryFee > 0) {
        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(MUTED)
          .text("Frais de livraison", colPrice, rowY, {
            width: 72,
            align: "right",
          });
        doc
          .font("Regular")
          .fontSize(9)
          .fillColor(DARK)
          .text(
            formatAmount(order.deliveryFee, order.currency),
            colTotal,
            rowY,
            { width: W - M - colTotal - PAD, align: "right" },
          );
        rowY += 18;
      }

      // Total row
      const totalW = W - M - colPrice + 16;
      doc.rect(colPrice - 16, rowY + 4, totalW, 36).fill(DARK);
      doc
        .font("Bold")
        .fontSize(11)
        .fillColor(WHITE)
        .text("TOTAL", colPrice - 6, rowY + 14, { width: 70 });
      doc
        .font("Bold")
        .fontSize(13)
        .fillColor(WHITE)
        .text(
          formatAmount(order.total, order.currency),
          colPrice - 16,
          rowY + 12,
          { width: totalW - PAD, align: "right" },
        );

      // ── Note ──────────────────────────────────────────────────────────────
      if (order.note) {
        const noteY = rowY + 56;
        doc.font("Bold").fontSize(8).fillColor(MUTED).text("NOTE", M, noteY);
        doc
          .font("Regular")
          .fontSize(8.5)
          .fillColor(DARK)
          .text(order.note, M, noteY + 12, { width: CW });
      }

      // ── Footer ────────────────────────────────────────────────────────────
      doc.rect(0, 841.89 - 56, W, 56).fill(DARK);
      doc
        .font("Regular")
        .fontSize(9)
        .fillColor(WHITE)
        .text("Merci pour votre commande — SwiftGoma", M, 841.89 - 56 + 14, {
          width: CW,
          align: "center",
        });
      doc
        .font("Regular")
        .fontSize(7.5)
        .fillColor(MUTED)
        .text(
          "swiftgoma.com · support@swiftgoma.com · Goma, DRC",
          M,
          841.89 - 56 + 30,
          { width: CW, align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateOrderConfirmationPdf };
