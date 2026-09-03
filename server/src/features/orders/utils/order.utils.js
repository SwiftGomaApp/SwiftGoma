const crypto = require("crypto");
const { ValidationError, ConflictError } = require("../../../common/errors");
const { ORDER_CONFIG } = require("../config/order.config");

function generateQrToken() {
  return crypto.randomBytes(ORDER_CONFIG.QR_TOKEN_BYTES).toString("hex");
}

function isValidDeliveryAddress(address) {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  return (
    trimmed.length >= ORDER_CONFIG.DELIVERY_ADDRESS_MIN_LENGTH &&
    trimmed.length <= ORDER_CONFIG.DELIVERY_ADDRESS_MAX_LENGTH
  );
}

function assertValidItems(items) {
  if (!Array.isArray(items) || items.length < ORDER_CONFIG.MIN_ITEMS) {
    throw new ValidationError("Au moins un article est requis.");
  }
  if (items.length > ORDER_CONFIG.MAX_ITEMS) {
    throw new ValidationError(
      `Une commande ne peut pas dépasser ${ORDER_CONFIG.MAX_ITEMS} articles distincts.`,
    );
  }
  items.forEach((item) => {
    if (!item.variantId) {
      throw new ValidationError("variantId requis pour chaque article.");
    }
    const qty = Number(item.quantity);
    if (
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > ORDER_CONFIG.MAX_QUANTITY_PER_ITEM
    ) {
      throw new ValidationError(
        `Quantité invalide pour un article (doit être entre 1 et ${ORDER_CONFIG.MAX_QUANTITY_PER_ITEM}).`,
      );
    }
  });
}

function assertValidFulfillmentInput(
  fulfillmentMethod,
  deliveryAddress,
  deliveryLatitude,
  deliveryLongitude,
) {
  if (fulfillmentMethod === "DELIVERY") {
    if (!isValidDeliveryAddress(deliveryAddress)) {
      throw new ValidationError(
        `L'adresse de livraison doit contenir entre ${ORDER_CONFIG.DELIVERY_ADDRESS_MIN_LENGTH} et ${ORDER_CONFIG.DELIVERY_ADDRESS_MAX_LENGTH} caractères.`,
      );
    }
    if (!isValidCoordinates(deliveryLatitude, deliveryLongitude)) {
      throw new ValidationError(
        "Coordonnées GPS invalides ou manquantes pour une commande en livraison.",
      );
    }
  }
}

function isValidCoordinates(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180
  );
}

function assertValidStatusTransition(
  currentStatus,
  nextStatus,
  fulfillmentMethod,
) {
  const allowed = ORDER_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut de commande invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }

  if (
    ORDER_CONFIG.PICKUP_ONLY_STATUSES.includes(nextStatus) &&
    fulfillmentMethod !== "PICKUP"
  ) {
    throw new ConflictError(
      `Le statut "${nextStatus}" n'est valide que pour une commande en retrait (PICKUP).`,
    );
  }
  if (
    ORDER_CONFIG.DELIVERY_ONLY_STATUSES.includes(nextStatus) &&
    fulfillmentMethod !== "DELIVERY"
  ) {
    throw new ConflictError(
      `Le statut "${nextStatus}" n'est valide que pour une commande en livraison (DELIVERY).`,
    );
  }
}

function assertCancellable(status) {
  if (!ORDER_CONFIG.CANCELLABLE_STATUSES.includes(status)) {
    throw new ConflictError(
      `Cette commande ne peut plus être annulée (statut actuel : "${status}").`,
    );
  }
}

function calculateOrderTotals(resolvedItems, deliveryFee = 0) {
  const subtotal = resolvedItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  );
  const total = subtotal + Number(deliveryFee);
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

function assertValidCheckoutCurrency(currency) {
  if (!ORDER_CONFIG.SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError(
      `Devise non supportée pour le paiement : "${currency}". Devises acceptées : ${ORDER_CONFIG.SUPPORTED_CURRENCIES.join(", ")}.`,
    );
  }
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371.0088;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function calculateDeliveryFee(
  shop,
  deliveryLatitude,
  deliveryLongitude,
  perKmRate,
) {
  const flatFee = Number(shop.deliveryFee);

  const hasShopCoords =
    shop.latitude != null &&
    shop.longitude != null &&
    isValidCoordinates(shop.latitude, shop.longitude);
  const hasDeliveryCoords =
    deliveryLatitude != null &&
    deliveryLongitude != null &&
    isValidCoordinates(deliveryLatitude, deliveryLongitude);

  if (perKmRate == null || !hasShopCoords || !hasDeliveryCoords) {
    return flatFee;
  }

  const distanceKm = haversineDistanceKm(
    shop.latitude,
    shop.longitude,
    deliveryLatitude,
    deliveryLongitude,
  );
  const adjustedDistanceKm =
    distanceKm * ORDER_CONFIG.DELIVERY_DISTANCE_ROAD_FACTOR;
  const freeKm = shop.deliveryFreeKm != null ? Number(shop.deliveryFreeKm) : 0;
  const billableKm = Math.max(0, adjustedDistanceKm - freeKm);

  return flatFee + billableKm * perKmRate;
}

module.exports = {
  generateQrToken,
  isValidDeliveryAddress,
  assertValidItems,
  assertValidFulfillmentInput,
  assertValidStatusTransition,
  assertCancellable,
  calculateOrderTotals,
  assertValidCheckoutCurrency,
  haversineDistanceKm,
  calculateDeliveryFee,
};
