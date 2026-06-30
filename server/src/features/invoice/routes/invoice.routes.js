const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  listInvoices,
  getInvoice,
  adminListInvoices,
  adminGetInvoice,
} = require("../controller/invoice.controller");

const router = express.Router();

router.get("/", authenticate, requireVerified, listInvoices);
router.get("/:id", authenticate, requireVerified, getInvoice);

router.get("/admin/all", authenticate, requireRole("ADMIN"), adminListInvoices);
router.get("/admin/:id", authenticate, requireRole("ADMIN"), adminGetInvoice);

module.exports = { invoiceRouter: router };
