const express = require("express");
const {
  postSubscribe,
  getMySubscription,
  getMyPaymentHistory,
  postCancelMySubscription,
  postCheckPaymentStatus,
  postReactivateMySubscription,
  postUpgrade,
  getStats,
  getRevenue,
} = require("../controllers/subscription.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const { paymentLimiter } = require("../../../common/middleware/rateLimiters");

const SubscriptionRouter = express.Router();

SubscriptionRouter.use(authenticate);

SubscriptionRouter.post(
  "/",
  authorize("SELLER"),
  paymentLimiter,
  postSubscribe,
);
SubscriptionRouter.post(
  "/upgrade",
  authorize("SELLER"),
  paymentLimiter,
  postUpgrade,
);
SubscriptionRouter.get("/me", authorize("SELLER"), getMySubscription);
SubscriptionRouter.get(
  "/me/payments",
  authorize("SELLER"),
  getMyPaymentHistory,
);
SubscriptionRouter.post(
  "/me/cancel",
  authorize("SELLER"),
  postCancelMySubscription,
);
SubscriptionRouter.post(
  "/me/reactivate",
  authorize("SELLER"),
  postReactivateMySubscription,
);
SubscriptionRouter.post(
  "/payments/:depositId/check-status",
  authorize("SELLER"),
  postCheckPaymentStatus,
);
SubscriptionRouter.get("/stats", authorize("ADMIN", "ACCOUNTANT"), getStats);
SubscriptionRouter.get("/revenue", authorize("ADMIN", "ACCOUNTANT"), getRevenue);

module.exports = SubscriptionRouter;
