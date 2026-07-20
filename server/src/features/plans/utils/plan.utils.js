const { ValidationError } = require("../../../common/errors");
const { PLAN_CONFIG } = require("../config/plan.config");
const {
  BILLING_CYCLES,
  SUPPORTED_CURRENCIES,
} = require("../constants/plan.constants");

function isValidPlanName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= PLAN_CONFIG.NAME_MIN_LENGTH &&
    trimmed.length <= PLAN_CONFIG.NAME_MAX_LENGTH
  );
}

function isValidMaxProducts(value) {
  return Number.isInteger(value) && value >= PLAN_CONFIG.MIN_MAX_PRODUCTS;
}

function isValidMaxPhotosPerProduct(value) {
  return (
    Number.isInteger(value) &&
    value >= PLAN_CONFIG.MIN_MAX_PHOTOS_PER_PRODUCT &&
    value <= PLAN_CONFIG.MAX_PHOTOS_PER_PRODUCT_CAP
  );
}

function isValidBillingCycle(value) {
  return Object.values(BILLING_CYCLES).includes(value);
}

function isValidCurrency(value) {
  return SUPPORTED_CURRENCIES.includes(value);
}

function isValidPriceAmount(amount) {
  const num = Number(amount);
  return Number.isFinite(num) && num > 0;
}

function assertValidPlanInput(input) {
  if (!isValidPlanName(input.name)) {
    throw new ValidationError(
      `Le nom du plan doit contenir entre ${PLAN_CONFIG.NAME_MIN_LENGTH} et ${PLAN_CONFIG.NAME_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidMaxProducts(input.maxProducts)) {
    throw new ValidationError("Nombre maximum de produits invalide.");
  }
  if (!isValidMaxPhotosPerProduct(input.maxPhotosPerProduct)) {
    throw new ValidationError(
      `Le nombre de photos par produit doit être entre ${PLAN_CONFIG.MIN_MAX_PHOTOS_PER_PRODUCT} et ${PLAN_CONFIG.MAX_PHOTOS_PER_PRODUCT_CAP}.`,
    );
  }
}

function assertCompletePriceCoverage(prices) {
  const missing = [];
  for (const cycle of PLAN_CONFIG.REQUIRED_BILLING_CYCLES) {
    for (const currency of PLAN_CONFIG.REQUIRED_CURRENCIES) {
      const exists = prices.some(
        (p) => p.billingCycle === cycle && p.currency === currency,
      );
      if (!exists) missing.push(`${cycle}/${currency}`);
    }
  }
  if (missing.length > 0) {
    throw new ValidationError(
      `Prix manquants pour ce plan : ${missing.join(", ")}.`,
    );
  }
}

module.exports = {
  isValidPlanName,
  isValidMaxProducts,
  isValidMaxPhotosPerProduct,
  isValidBillingCycle,
  isValidCurrency,
  isValidPriceAmount,
  assertValidPlanInput,
  assertCompletePriceCoverage,
};
