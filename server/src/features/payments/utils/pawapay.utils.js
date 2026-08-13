const crypto = require("crypto");
const { ValidationError } = require("../../../common/errors");

const ZERO_DECIMAL_CURRENCIES = ["CDF", "XAF", "XOF", "RWF", "USD"];

function generateTransactionId() {
  return crypto.randomUUID();
}

function isValidAmount(amount) {
  if (amount === undefined || amount === null) return false;
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

function formatAmount(amount, decimalsInAmount) {
  if (!isValidAmount(amount)) {
    throw new ValidationError("Montant invalide.");
  }
  const num = Number(amount);
  return decimalsInAmount === "NONE" ? String(Math.round(num)) : num.toFixed(2);
}

function isValidMsisdn(msisdn) {
  if (!msisdn || typeof msisdn !== "string") return false;
  return /^[0-9]{9,15}$/.test(msisdn.replace(/^\+/, ""));
}

function normalizeMsisdn(phone) {
  if (!phone) return "";
  return phone
    .replace(/[^0-9]/g, "")
    .replace(/^0+/, (match) =>
      match.length === phone.replace(/[^0-9]/g, "").length ? match : "",
    );
}

function isValidStatementDescription(description) {
  if (!description || typeof description !== "string") return false;
  const trimmed = description.trim();
  return /^[a-zA-Z0-9 ]{4,22}$/.test(trimmed);
}

function buildMetadata(entries) {
  const metadata = Object.entries(entries)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([fieldName, fieldValue]) => {
      const isPII = typeof fieldValue === "object" && fieldValue?.isPII;
      const rawValue = isPII ? fieldValue.value : fieldValue;
      return isPII
        ? { [fieldName]: String(rawValue), isPII: true }
        : { [fieldName]: String(rawValue) };
    });

  if (metadata.length > 10) {
    throw new ValidationError("Les métadonnées ne peuvent pas dépasser 10 éléments.");
  }
  return metadata;
}

module.exports = {
  generateTransactionId,
  isValidAmount,
  formatAmount,
  isValidMsisdn,
  normalizeMsisdn,
  isValidStatementDescription,
  buildMetadata,
};
