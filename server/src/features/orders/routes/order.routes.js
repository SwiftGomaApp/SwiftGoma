const express = require("express");
const {
  postCheckout,
  getMyOrders,
  postCancelOrder,
  getOrderQr,
  postScanQr,
  postAcceptOrder,
  postRejectOrder,
  postMarkReady,
  postCompletePickup,
  postAssignRider,
  getShopOrders,
  postMarkPickedUp,
  postMarkOnTheWay,
  postCompleteDelivery,
  postMarkFailedDelivery,
  getMyDeliveries,
  getOrder,
  postConfirmReceipt,
  getOrderMessages,
  postOrderMessage,
  postMarkOrderMessagesRead,
} = require("../controllers/order.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  paymentLimiter,
  chatMessageLimiter,
} = require("../../../common/middleware/rateLimiters");
const { idempotencyGuard } = require("../../../common/middleware/idempotency");

const OrderRouter = express.Router();

OrderRouter.use(authenticate);

OrderRouter.post(
  "/checkout",
  paymentLimiter,
  idempotencyGuard({ scope: "order-checkout" }),
  postCheckout,
);
OrderRouter.get("/me", getMyOrders);
OrderRouter.post("/:id/cancel", postCancelOrder);
OrderRouter.post("/:id/confirm-receipt", postConfirmReceipt);
OrderRouter.get("/:id/qr-code", getOrderQr);

OrderRouter.get("/:id/messages", getOrderMessages);
OrderRouter.post("/:id/messages", chatMessageLimiter, postOrderMessage);
OrderRouter.post("/:id/messages/read", postMarkOrderMessagesRead);

OrderRouter.post("/scan", postScanQr);

OrderRouter.post("/:id/accept", authorize("SELLER"), postAcceptOrder);
OrderRouter.post("/:id/reject", authorize("SELLER"), postRejectOrder);
OrderRouter.post("/:id/ready", authorize("SELLER"), postMarkReady);
OrderRouter.post(
  "/:id/complete-pickup",
  authorize("SELLER"),
  postCompletePickup,
);
OrderRouter.post("/:id/assign-rider", authorize("SELLER"), postAssignRider);
OrderRouter.get("/shop/:shopId", authorize("SELLER"), getShopOrders);

OrderRouter.post("/:id/picked-up", authorize("RIDER"), postMarkPickedUp);
OrderRouter.post("/:id/on-the-way", authorize("RIDER"), postMarkOnTheWay);
OrderRouter.post(
  "/:id/complete-delivery",
  authorize("RIDER"),
  postCompleteDelivery,
);
OrderRouter.post(
  "/:id/failed-delivery",
  authorize("RIDER"),
  postMarkFailedDelivery,
);
OrderRouter.get("/rider/me", authorize("RIDER"), getMyDeliveries);

OrderRouter.get("/:id", getOrder);

module.exports = OrderRouter;
