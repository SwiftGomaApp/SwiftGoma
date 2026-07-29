const {
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  getCart,
  listMyCarts,
  clearCart,
} = require("../services/cart.service");

async function postAddItem(req, res, next) {
  try {
    const item = await addItemToCart(req.user.id, {
      shopId: req.body.shopId,
      variantId: req.body.variantId,
      quantity: req.body.quantity,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function putUpdateItemQuantity(req, res, next) {
  try {
    const item = await updateCartItemQuantity(
      req.user.id,
      req.params.itemId,
      req.body.quantity,
    );
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const result = await removeCartItem(req.user.id, req.params.itemId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getCartForShop(req, res, next) {
  try {
    const cart = await getCart(req.user.id, req.params.shopId);
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

async function getMyCarts(req, res, next) {
  try {
    const carts = await listMyCarts(req.user.id);
    res.status(200).json({ success: true, data: carts });
  } catch (err) {
    next(err);
  }
}

async function postClearCart(req, res, next) {
  try {
    const result = await clearCart(req.user.id, req.params.shopId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postAddItem,
  putUpdateItemQuantity,
  deleteItem,
  getCartForShop,
  getMyCarts,
  postClearCart,
};
