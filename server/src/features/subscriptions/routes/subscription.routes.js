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
} = require("../controllers/subscription.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const SubscriptionRouter = express.Router();

SubscriptionRouter.use(authenticate);

SubscriptionRouter.post("/", postSubscribe);
SubscriptionRouter.post("/upgrade", postUpgrade);
SubscriptionRouter.get("/me", getMySubscription);
SubscriptionRouter.get("/me/payments", getMyPaymentHistory);
SubscriptionRouter.post("/me/cancel", postCancelMySubscription);
SubscriptionRouter.post("/me/reactivate", postReactivateMySubscription);
SubscriptionRouter.post(
  "/payments/:depositId/check-status",
  postCheckPaymentStatus,
);
SubscriptionRouter.get("/stats", authorize("ADMIN"), getStats);

module.exports = SubscriptionRouter;
