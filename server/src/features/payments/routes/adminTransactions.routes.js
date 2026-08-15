const express = require("express");
const {
  getAdminTransactions,
} = require("../controllers/adminTransactions.controller");
const {
  getPaymentLedger,
  exportPaymentLedgerCsvHandler,
} = require("../controllers/paymentLedger.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AdminTransactionsRouter = express.Router();
AdminTransactionsRouter.use(authenticate);
AdminTransactionsRouter.get(
  "/",
  authorize("ADMIN", "ACCOUNTANT"),
  getAdminTransactions,
);

const PaymentLedgerRouter = express.Router();
PaymentLedgerRouter.use(authenticate);
PaymentLedgerRouter.get(
  "/",
  authorize("ADMIN", "ACCOUNTANT"),
  getPaymentLedger,
);

PaymentLedgerRouter.get(
  "/export/csv",
  authorize("ADMIN", "ACCOUNTANT"),
  exportPaymentLedgerCsvHandler,
);

module.exports = AdminTransactionsRouter;
