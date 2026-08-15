const express = require("express");
const {
  getAdminOrders,
  getAdminOrder,
  postAdminCancelOrder,
  postAdminRefundOrder,
  postRequestOrderRefundApproval,
  postConfirmOrderRefund,
} = require("../controllers/adminOrder.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  payoutOtpLimiter,
  payoutConfirmLimiter,
} = require("../../../common/middleware/rateLimiters");

const AdminOrderRouter = express.Router();

AdminOrderRouter.use(authenticate);
AdminOrderRouter.get(
  "/",
  authorize("ADMIN", "SUPPORT", "ACCOUNTANT"),
  getAdminOrders,
);
AdminOrderRouter.get(
  "/:id",
  authorize("ADMIN", "SUPPORT", "ACCOUNTANT"),
  getAdminOrder,
);
AdminOrderRouter.post(
  "/:id/cancel",
  authorize("ADMIN", "SUPPORT"),
  postAdminCancelOrder,
);
AdminOrderRouter.post(
  "/:id/refund/request-approval",
  authorize("ADMIN"),
  payoutOtpLimiter,
  postRequestOrderRefundApproval,
);
AdminOrderRouter.post(
  "/:id/refund/confirm",
  authorize("ADMIN"),
  payoutConfirmLimiter,
  postConfirmOrderRefund,
);
AdminOrderRouter.post(
  "/:id/refund",
  authorize("ADMIN"),
  payoutConfirmLimiter,
  postAdminRefundOrder,
);

module.exports = AdminOrderRouter;
