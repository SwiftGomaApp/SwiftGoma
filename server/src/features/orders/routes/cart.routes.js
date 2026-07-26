const express = require("express");
const {
  postAddItem,
  putUpdateItemQuantity,
  deleteItem,
  getCartForShop,
  getMyCarts,
  postClearCart,
} = require("../controllers/cart.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const CartRouter = express.Router();

CartRouter.use(authenticate);

CartRouter.post("/items", postAddItem);
CartRouter.put("/items/:itemId", putUpdateItemQuantity);
CartRouter.delete("/items/:itemId", deleteItem);

CartRouter.get("/", getMyCarts);
CartRouter.get("/shop/:shopId", getCartForShop);
CartRouter.post("/shop/:shopId/clear", postClearCart);

module.exports = CartRouter;
