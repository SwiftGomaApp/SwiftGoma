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

SubscriptionRouter.post("/", paymentLimiter, postSubscribe);
SubscriptionRouter.post("/upgrade", paymentLimiter, postUpgrade);
SubscriptionRouter.get("/me", getMySubscription);
SubscriptionRouter.get("/me/payments", getMyPaymentHistory);
SubscriptionRouter.post("/me/cancel", postCancelMySubscription);
SubscriptionRouter.post("/me/reactivate", postReactivateMySubscription);
SubscriptionRouter.post(
  "/payments/:depositId/check-status",
  postCheckPaymentStatus,
);
SubscriptionRouter.get("/stats", authorize("ADMIN"), getStats);
SubscriptionRouter.get("/revenue", authorize("ADMIN"), getRevenue);

module.exports = SubscriptionRouter;
