const express = require("express");
const {
  getAdminInvoices,
  getAdminInvoiceDownload,
} = require("../controllers/adminInvoice.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AdminInvoiceRouter = express.Router();

AdminInvoiceRouter.use(authenticate);
AdminInvoiceRouter.get(
  "/",
  authorize("ADMIN", "ACCOUNTANT"),
  getAdminInvoices,
);
AdminInvoiceRouter.get(
  "/:id",
  authorize("ADMIN", "ACCOUNTANT"),
  getAdminInvoiceDownload,
);

module.exports = AdminInvoiceRouter;
