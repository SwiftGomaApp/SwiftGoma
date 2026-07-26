const { ValidationError } = require("../../../common/errors");
const { CART_CONFIG } = require("../config/cart.config");

function isValidQuantity(quantity) {
  const num = Number(quantity);
  return (
    Number.isInteger(num) &&
    num >= 1 &&
    num <= CART_CONFIG.MAX_QUANTITY_PER_ITEM
  );
}

function assertValidQuantity(quantity) {
  if (!isValidQuantity(quantity)) {
    throw new ValidationError(
      `La quantité doit être entre 1 et ${CART_CONFIG.MAX_QUANTITY_PER_ITEM}.`,
    );
  }
}

function assertCartNotFull(currentItemCount) {
  if (currentItemCount >= CART_CONFIG.MAX_ITEMS_PER_CART) {
    throw new ValidationError(
      `Un panier ne peut pas dépasser ${CART_CONFIG.MAX_ITEMS_PER_CART} articles distincts.`,
    );
  }
}

module.exports = {
  isValidQuantity,
  assertValidQuantity,
  assertCartNotFull,
};
