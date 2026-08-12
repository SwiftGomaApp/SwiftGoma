const express = require("express");
const {
  getReportPreview,
  downloadReportPdf,
  sendReportEmail,
  getReportHistory,
  downloadStoredReportPdf,
} = require("../controllers/accountantReport.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const AccountingRouter = express.Router();

AccountingRouter.use(authenticate, authorize("ADMIN", "ACCOUNTANT"));

AccountingRouter.get("/report", getReportPreview);
AccountingRouter.get("/report/pdf", downloadReportPdf);
AccountingRouter.post("/report/email", sendReportEmail);
AccountingRouter.get("/reports", getReportHistory);
AccountingRouter.get("/reports/:id/pdf", downloadStoredReportPdf);

module.exports = AccountingRouter;
