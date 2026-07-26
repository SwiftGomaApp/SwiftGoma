const { getPrismaClient } = require("../../../config/prisma");
const { INVOICING_CONFIG } = require("../config/invoicing.config");

const prisma = getPrismaClient();

async function generateDocumentNumber(type) {
  const year = new Date().getFullYear();
  const prefix = INVOICING_CONFIG.DOCUMENT_NUMBER_PREFIXES[type];
  if (!prefix) {
    throw new Error(`generateDocumentNumber: unknown document type "${type}"`);
  }

  const sequenceId = `${type}-${year}`;

  const result = await prisma.$queryRaw`
    INSERT INTO document_sequences (id, value)
    VALUES (${sequenceId}, 1)
    ON CONFLICT (id) DO UPDATE SET value = document_sequences.value + 1
    RETURNING value;
  `;

  const nextValue = result[0].value;
  const nextNumber = String(nextValue).padStart(
    INVOICING_CONFIG.DOCUMENT_NUMBER_PADDING,
    "0",
  );

  return `${prefix}-${year}-${nextNumber}`;
}

function formatPeriodLabel(periodStart, periodEnd) {
  const startLabel = new Date(periodStart).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  const endLabel = new Date(periodEnd).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

function formatPaymentMethodLabel(providerCode) {
  if (!providerCode) return "Mobile Money";

  const normalized = providerCode.toString().toLowerCase();

  const providerNames = {
    // PawaPay (subscriptions)
    airtel_cod: "Mobile Money — Airtel",
    orange_cod: "Mobile Money — Orange",
    vodacom_mpesa_cod: "Mobile Money — Vodacom M-Pesa",
    mtn_momo_rwa: "Mobile Money — MTN",
    airtel_rwa: "Mobile Money — Airtel",
    // MbiyoPay (commandes)
    airtel: "Mobile Money — Airtel",
    orange: "Mobile Money — Orange",
    vodacom: "Mobile Money — Vodacom",
    africell: "Mobile Money — Africell",
    mtn: "Mobile Money — MTN",
  };

  return providerNames[normalized] || "Mobile Money";
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

module.exports = {
  generateDocumentNumber,
  formatPeriodLabel,
  formatPaymentMethodLabel,
  formatDate,
};
