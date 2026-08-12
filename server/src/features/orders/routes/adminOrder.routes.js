const express = require("express");
const {
  getAdminOrders,
  getAdminOrder,
  postAdminCancelOrder,
  postAdminRefundOrder,
} = require("../controllers/adminOrder.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AdminOrderRouter = express.Router();

AdminOrderRouter.use(authenticate);
AdminOrderRouter.get("/", authorize("ADMIN", "SUPPORT"), getAdminOrders);
AdminOrderRouter.get("/:id", authorize("ADMIN", "SUPPORT"), getAdminOrder);
AdminOrderRouter.post(
  "/:id/cancel",
  authorize("ADMIN", "SUPPORT"),
  postAdminCancelOrder,
);
AdminOrderRouter.post("/:id/refund", authorize("ADMIN"), postAdminRefundOrder);

module.exports = AdminOrderRouter;
