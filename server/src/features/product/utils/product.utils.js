const { ValidationError, ConflictError } = require("../../../common/errors");
const { PRODUCT_CONFIG } = require("../config/product.config");

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isValidProductName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= PRODUCT_CONFIG.NAME_MIN_LENGTH &&
    trimmed.length <= PRODUCT_CONFIG.NAME_MAX_LENGTH
  );
}

function isValidDescription(description) {
  if (!description || typeof description !== "string") return false;
  const trimmed = description.trim();
  return (
    trimmed.length >= PRODUCT_CONFIG.DESCRIPTION_MIN_LENGTH &&
    trimmed.length <= PRODUCT_CONFIG.DESCRIPTION_MAX_LENGTH
  );
}

function isValidCurrency(currency) {
  return PRODUCT_CONFIG.SUPPORTED_CURRENCIES.includes(currency);
}

function isValidUnit(unit) {
  return PRODUCT_CONFIG.ALLOWED_UNITS.includes(unit);
}

function isValidWeightGrams(weightGrams) {
  if (weightGrams === undefined || weightGrams === null) return true;
  const num = Number(weightGrams);
  return (
    Number.isInteger(num) &&
    num >= PRODUCT_CONFIG.WEIGHT_GRAMS_MIN &&
    num <= PRODUCT_CONFIG.WEIGHT_GRAMS_MAX
  );
}

function isValidPrice(price, currency) {
  if (!isValidCurrency(currency)) return false;
  const num = Number(price);
  if (!Number.isFinite(num)) return false;
  const min = PRODUCT_CONFIG.PRICE_MIN[currency];
  const max = PRODUCT_CONFIG.PRICE_MAX[currency];
  return num >= min && num <= max;
}

function isValidStock(stock) {
  const num = Number(stock);
  return (
    Number.isInteger(num) &&
    num >= PRODUCT_CONFIG.STOCK_MIN &&
    num <= PRODUCT_CONFIG.STOCK_MAX
  );
}

function assertExpiryRequiredIfFood(categorySlug, expiresAt) {
  if (categorySlug === PRODUCT_CONFIG.EXPIRY_REQUIRED_FOR_CATEGORY_SLUG) {
    if (!expiresAt) {
      throw new ValidationError(
        "Une date de péremption est requise pour les produits alimentaires.",
      );
    }
    if (new Date(expiresAt) <= new Date()) {
      throw new ValidationError(
        "La date de péremption doit être dans le futur.",
      );
    }
  }
}

function assertValidProductInput(input) {
  const { name, description, currency, unit, weightGrams } = input;

  if (!isValidProductName(name)) {
    throw new ValidationError(
      `Le nom du produit doit contenir entre ${PRODUCT_CONFIG.NAME_MIN_LENGTH} et ${PRODUCT_CONFIG.NAME_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidDescription(description)) {
    throw new ValidationError(
      `La description doit contenir entre ${PRODUCT_CONFIG.DESCRIPTION_MIN_LENGTH} et ${PRODUCT_CONFIG.DESCRIPTION_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidCurrency(currency)) {
    throw new ValidationError("Devise non prise en charge.");
  }
  if (unit !== undefined && !isValidUnit(unit)) {
    throw new ValidationError("Unité de mesure invalide.");
  }
  if (!isValidWeightGrams(weightGrams)) {
    throw new ValidationError(
      `Le poids doit être entre ${PRODUCT_CONFIG.WEIGHT_GRAMS_MIN}g et ${PRODUCT_CONFIG.WEIGHT_GRAMS_MAX}g.`,
    );
  }
}

function assertValidVariantInput(variant, currency) {
  if (!isValidPrice(variant.price, currency)) {
    throw new ValidationError("Prix de variante invalide pour cette devise.");
  }
  if (!isValidStock(variant.stock)) {
    throw new ValidationError(
      `Le stock doit être entre ${PRODUCT_CONFIG.STOCK_MIN} et ${PRODUCT_CONFIG.STOCK_MAX}.`,
    );
  }
}

function assertValidVariantCount(count) {
  if (count > PRODUCT_CONFIG.MAX_VARIANTS_PER_PRODUCT) {
    throw new ValidationError(
      `Un produit ne peut pas avoir plus de ${PRODUCT_CONFIG.MAX_VARIANTS_PER_PRODUCT} variantes.`,
    );
  }
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  const allowed =
    PRODUCT_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut produit invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }
}

function assertCanCreateProduct(currentProductCount, maxProducts, planName) {
  if (currentProductCount >= maxProducts) {
    throw new ConflictError(
      `Votre plan (${planName}) autorise au maximum ${maxProducts} produit(s). Passez à un plan supérieur pour en ajouter davantage.`,
    );
  }
}

function assertPhotoLimitNotExceeded(
  currentPhotoCount,
  newPhotoCount,
  maxPhotosPerProduct,
  planName,
) {
  if (currentPhotoCount + newPhotoCount > maxPhotosPerProduct) {
    throw new ConflictError(
      `Votre plan (${planName}) autorise au maximum ${maxPhotosPerProduct} photo(s) par produit.`,
    );
  }
}

module.exports = {
  generateSlug,
  isValidProductName,
  isValidDescription,
  isValidCurrency,
  isValidUnit,
  isValidWeightGrams,
  isValidPrice,
  isValidStock,
  assertExpiryRequiredIfFood,
  assertValidProductInput,
  assertValidVariantInput,
  assertValidVariantCount,
  assertValidStatusTransition,
  assertCanCreateProduct,
  assertPhotoLimitNotExceeded,
};
