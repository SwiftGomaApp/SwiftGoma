const express = require("express");
const {
  getAdminSubscriptions,
  getAdminSubscription,
} = require("../controllers/adminSubscription.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AdminSubscriptionRouter = express.Router();

AdminSubscriptionRouter.use(authenticate);
AdminSubscriptionRouter.get(
  "/",
  authorize("ADMIN", "ACCOUNTANT"),
  getAdminSubscriptions,
);
AdminSubscriptionRouter.get(
  "/:id",
  authorize("ADMIN", "ACCOUNTANT"),
  getAdminSubscription,
);

module.exports = AdminSubscriptionRouter;
