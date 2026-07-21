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

function formatPaymentMethodLabel(mobileMoneyProvider) {
  const providerNames = {
    AIRTEL_COD: "Mobile Money — Airtel",
    ORANGE_COD: "Mobile Money — Orange",
    VODACOM_MPESA_COD: "Mobile Money — Vodacom M-Pesa",
    MTN_MOMO_RWA: "Mobile Money — MTN",
    AIRTEL_RWA: "Mobile Money — Airtel",
  };
  return providerNames[mobileMoneyProvider] || "Mobile Money";
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
