const fs = require("fs");
const path = require("path");
const {
  generateInvoicePdf,
  generateReceiptPdf,
} = require("../src/features/invoicing/utils/invoicePdf");

const OUTPUT_DIR = path.join(__dirname, "../tmp");

const fakeSeller = {
  businessName: "Boutique Chic Goma",
  address: "Avenue du Lac, Quartier Les Volcans, Goma",
  contactEmail: "contact@boutiquechic.com",
};

const fakeInvoiceData = {
  documentNumber: "SWG-INV-2026-000123",
  issuedAt: new Date(),
  seller: fakeSeller,
  planName: "Business",
  periodLabel: "20 juil. – 20 août 2026",
  quantity: 1,
  unitPrice: 15,
  amount: 15,
  currency: "USD",
};

const fakeReceiptData = {
  documentNumber: "SWG-REC-2026-000123",
  invoiceNumber: "SWG-INV-2026-000123",
  paidAt: new Date(),
  seller: fakeSeller,
  planName: "Business",
  periodLabel: "20 juil. – 20 août 2026",
  quantity: 1,
  unitPrice: 15,
  amount: 15,
  currency: "USD",
  paymentMethod: "Mobile Money — Airtel",
};

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("Génération de la facture...");
  const invoiceBuffer = await generateInvoicePdf(fakeInvoiceData);
  fs.writeFileSync(path.join(OUTPUT_DIR, "test-invoice.pdf"), invoiceBuffer);
  console.log("✅ tmp/test-invoice.pdf généré");

  console.log("Génération du reçu...");
  const receiptBuffer = await generateReceiptPdf(fakeReceiptData);
  fs.writeFileSync(path.join(OUTPUT_DIR, "test-receipt.pdf"), receiptBuffer);
  console.log("✅ tmp/test-receipt.pdf généré");
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
