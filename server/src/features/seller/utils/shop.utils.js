const {
  ValidationError,
  ConflictError,
  ForbiddenError,
} = require("../../../common/errors");
const { SHOP_CONFIG } = require("../config/shop.config");
const { getExchangeRate } = require("../../product/utils/exchangeRate.utils");

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isValidShopName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= SHOP_CONFIG.NAME_MIN_LENGTH &&
    trimmed.length <= SHOP_CONFIG.NAME_MAX_LENGTH
  );
}

function assertCanCreateShop(currentShopCount, maxShops, planName) {
  if (currentShopCount >= maxShops) {
    throw new ConflictError(
      `Votre plan (${planName}) autorise au maximum ${maxShops} boutique(s). Passez à un plan supérieur pour en créer davantage.`,
    );
  }
}

function isValidDescription(description) {
  if (!description || typeof description !== "string") return false;
  const trimmed = description.trim();
  return (
    trimmed.length >= SHOP_CONFIG.DESCRIPTION_MIN_LENGTH &&
    trimmed.length <= SHOP_CONFIG.DESCRIPTION_MAX_LENGTH
  );
}

async function isValidDeliveryFee(amount, currency) {
  if (!SHOP_CONFIG.SUPPORTED_DELIVERY_CURRENCIES.includes(currency))
    return false;
  const num = Number(amount);
  if (!Number.isFinite(num)) return false;

  // Bounds are defined once, in the base currency, then converted at
  // validation time using the platform's live admin-configured exchange
  // rate — so a rate update immediately keeps every currency's limits in
  // sync, instead of two hardcoded numbers silently drifting apart.
  const base = SHOP_CONFIG.DELIVERY_FEE_BASE_CURRENCY;
  const rate = await getExchangeRate(base, currency);
  const min = SHOP_CONFIG.DELIVERY_FEE_MIN_BASE * rate;
  const max = SHOP_CONFIG.DELIVERY_FEE_MAX_BASE * rate;
  return num >= min && num <= max;
}

async function assertValidShopInput(input) {
  const { name, description, deliveryFee, deliveryFeeCurrency } = input;

  if (!isValidShopName(name)) {
    throw new ValidationError(
      `Le nom de la boutique doit contenir entre ${SHOP_CONFIG.NAME_MIN_LENGTH} et ${SHOP_CONFIG.NAME_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidDescription(description)) {
    throw new ValidationError(
      `La description doit contenir entre ${SHOP_CONFIG.DESCRIPTION_MIN_LENGTH} et ${SHOP_CONFIG.DESCRIPTION_MAX_LENGTH} caractères.`,
    );
  }
  if (!(await isValidDeliveryFee(deliveryFee, deliveryFeeCurrency))) {
    throw new ValidationError(
      "Frais de livraison invalides pour cette devise.",
    );
  }
}

function assertValidShopLocation({ latitude, longitude }) {
  if (latitude === undefined && longitude === undefined) return;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new ValidationError("Coordonnées de la boutique invalides.");
  }
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  const allowed = SHOP_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut de boutique invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }
}

function assertCanPublish(subscription) {
  if (!SHOP_CONFIG.REQUIRES_ACTIVE_SUBSCRIPTION_TO_PUBLISH) return;

  if (!subscription || subscription.status !== "ACTIVE") {
    throw new ConflictError(
      "Un abonnement actif est requis pour publier votre boutique.",
    );
  }
}

function assertCanReactivate(shop, actorRole) {
  if (shop.suspendedBy === "ADMIN" && actorRole !== "ADMIN") {
    throw new ForbiddenError(
      "Cette boutique a été suspendue par un administrateur — seul un administrateur peut la réactiver.",
    );
  }
}

function assertCanDelete(shop) {
  if (!SHOP_CONFIG.DELETABLE_STATUSES.includes(shop.status)) {
    throw new ConflictError(
      "Dépubliez ou suspendez votre boutique avant de la supprimer.",
    );
  }
}

module.exports = {
  generateSlug,
  isValidShopName,
  isValidDescription,
  isValidDeliveryFee,
  assertValidShopInput,
  assertValidShopLocation,
  assertValidStatusTransition,
  assertCanPublish,
  assertCanReactivate,
  assertCanDelete,
  assertCanCreateShop,
};
