const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  placeOrder,
  listMyOrders,
  getMyOrder,
  confirmReception,
  buyerCancelOrder,
  listShopOrders,
  getShopOrder,
  confirmOrder,
  markPreparing,
  markShipped,
  sellerCancelOrder,
  listMyDeliveries,
  updateLocation,
  markDelivered,
} = require("../controllers/orders.controller");

const router = express.Router();

// ─── Buyer ────────────────────────────────────────────────────────────────────

router.post(
  "/",
  authenticate,
  requireVerified,
  requireRole("BUYER"),
  placeOrder,
);
router.get(
  "/",
  authenticate,
  requireVerified,
  requireRole("BUYER"),
  listMyOrders,
);
router.get(
  "/:id",
  authenticate,
  requireVerified,
  requireRole("BUYER"),
  getMyOrder,
);
router.patch(
  "/:id/confirm-reception",
  authenticate,
  requireVerified,
  requireRole("BUYER"),
  confirmReception,
);
router.delete(
  "/:id",
  authenticate,
  requireVerified,
  requireRole("BUYER"),
  buyerCancelOrder,
);

// ─── Seller ───────────────────────────────────────────────────────────────────

router.get(
  "/seller/shops/:shopId",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  listShopOrders,
);
router.get(
  "/seller/shops/:shopId/:id",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  getShopOrder,
);
router.patch(
  "/seller/shops/:shopId/:id/confirm",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  confirmOrder,
);
router.patch(
  "/seller/shops/:shopId/:id/prepare",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  markPreparing,
);
router.patch(
  "/seller/shops/:shopId/:id/ship",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  markShipped,
);
router.delete(
  "/seller/shops/:shopId/:id",
  authenticate,
  requireVerified,
  requireRole("SELLER"),
  sellerCancelOrder,
);

// ─── Deliverer ────────────────────────────────────────────────────────────────

router.get(
  "/deliverer",
  authenticate,
  requireVerified,
  requireRole("DELIVERER"),
  listMyDeliveries,
);
router.patch(
  "/deliverer/:id/location",
  authenticate,
  requireVerified,
  requireRole("DELIVERER"),
  updateLocation,
);
router.patch(
  "/deliverer/:id/deliver",
  authenticate,
  requireVerified,
  requireRole("DELIVERER"),
  markDelivered,
);

module.exports = { orderRouter: router };
