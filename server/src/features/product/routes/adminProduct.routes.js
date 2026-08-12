const express = require("express");
const {
  getAdminProducts,
  getAdminProduct,
  postAdminProductStatus,
} = require("../controllers/adminProduct.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AdminProductRouter = express.Router();

AdminProductRouter.use(authenticate);
AdminProductRouter.get("/", authorize("ADMIN", "SUPPORT"), getAdminProducts);
AdminProductRouter.get("/:id", authorize("ADMIN", "SUPPORT"), getAdminProduct);
AdminProductRouter.post(
  "/:id/status",
  authorize("ADMIN", "SUPPORT"),
  postAdminProductStatus,
);

module.exports = AdminProductRouter;
