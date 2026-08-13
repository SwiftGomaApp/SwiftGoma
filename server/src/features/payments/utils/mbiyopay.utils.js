const crypto = require("crypto");
const { ValidationError } = require("../../../common/errors");
const { env } = require("../../../config/env");

const SUPPORTED_COUNTRIES = {
  CD: {
    networks: ["vodacom", "airtel", "orange", "africell"],
    currencies: ["USD", "CDF"],
    limits: {
      USD: { min: 0.1, max: 2500 },
      CDF: { min: 40, max: 5000000 },
    },
  },
  RW: {
    networks: ["mtn", "airtel"],
    currencies: ["RWF"],
    limits: {
      RWF: { min: 100, max: 5000000 },
    },
  },
};

function generateOrderId(prefix = "SWG") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function isValidNetwork(network, countryCode) {
  const country = SUPPORTED_COUNTRIES[countryCode];
  if (!country) return false;
  return country.networks.includes(network);
}

function isValidCurrency(currency, countryCode) {
  const country = SUPPORTED_COUNTRIES[countryCode];
  if (!country) return false;
  return country.currencies.includes(currency);
}

function isValidAmount(amount, currency, countryCode) {
  if (!isValidCurrency(currency, countryCode)) return false;
  const num = Number(amount);
  if (!Number.isFinite(num)) return false;
  const { min, max } = SUPPORTED_COUNTRIES[countryCode].limits[currency];
  return num >= min && num <= max;
}

function normalizePhoneNumber(phone) {
  if (!phone) return "";
  return phone.replace(/[^0-9]/g, "");
}

function isValidPhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  return /^[0-9]{9,15}$/.test(normalized);
}

function assertValidPayinInput({
  amount,
  currency,
  network,
  phoneNumber,
  countryCode,
}) {
  if (!SUPPORTED_COUNTRIES[countryCode]) {
    throw new ValidationError(`Pays non supporté : "${countryCode}".`);
  }
  if (!isValidAmount(amount, currency, countryCode)) {
    const limits = SUPPORTED_COUNTRIES[countryCode].limits[currency];
    throw new ValidationError(
      limits
        ? `Montant invalide pour ${currency}. Doit être entre ${limits.min} et ${limits.max}.`
        : `Devise "${currency}" non supportée pour ce pays.`,
    );
  }
  if (!isValidNetwork(network, countryCode)) {
    throw new ValidationError(
      "Opérateur mobile money non supporté pour ce pays.",
    );
  }
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new ValidationError("Numéro de téléphone invalide.");
  }
}

function assertValidPayoutInput({
  amount,
  currency,
  network,
  phoneNumber,
  countryCode,
  beneficiary,
}) {
  assertValidPayinInput({
    amount,
    currency,
    network,
    phoneNumber,
    countryCode,
  });
  if (!beneficiary || typeof beneficiary !== "string" || !beneficiary.trim()) {
    throw new ValidationError("Nom du bénéficiaire requis pour un payout.");
  }
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!env.mbiyopay.webhookSecret) {

    console.error(
      "[mbiyopay] MBIYOPAY_WEBHOOK_SECRET is not configured — rejecting webhook (fail closed).",
    );
    return false;
  }
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", env.mbiyopay.webhookSecret)
    .update(rawBody)
    .digest("hex");

  let providedBuffer;
  try {
    providedBuffer = Buffer.from(signatureHeader, "hex");
  } catch {
    return false;
  }
  const expectedBuffer = Buffer.from(expected, "hex");

  if (providedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

module.exports = {
  SUPPORTED_COUNTRIES,
  generateOrderId,
  isValidNetwork,
  isValidCurrency,
  isValidAmount,
  normalizePhoneNumber,
  isValidPhoneNumber,
  assertValidPayinInput,
  assertValidPayoutInput,
  verifyWebhookSignature,
};
