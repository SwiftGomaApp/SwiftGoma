const express = require("express");
const {
  getMyInvoices,
  downloadMyInvoice,
  getInvoiceStatsHandler,
} = require("../controllers/invoice.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const InvoiceRouter = express.Router();

InvoiceRouter.use(authenticate);

InvoiceRouter.get("/me", getMyInvoices);
InvoiceRouter.get("/me/download/:id", downloadMyInvoice);

InvoiceRouter.get("/stats", authorize("ADMIN"), getInvoiceStatsHandler);

module.exports = InvoiceRouter;
