const express = require("express");
const {
  createExpenseHandler,
  listExpensesHandler,
  getExpenseHandler,
  rejectExpenseHandler,
  requestExpenseApprovalHandler,
  resendExpenseApprovalHandler,
  confirmExpenseApprovalHandler,
  getExpenseMetaHandler,
} = require("../controllers/expense.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  documentUpload,
  verifyDocumentContents,
} = require("../../../common/middleware/upload");
const {
  payoutOtpLimiter,
  payoutOtpResendLimiter,
  payoutConfirmLimiter,
} = require("../../../common/middleware/rateLimiters");

const ExpenseRouter = express.Router();

ExpenseRouter.use(authenticate);

ExpenseRouter.get(
  "/meta",
  authorize("ADMIN", "ACCOUNTANT"),
  getExpenseMetaHandler,
);
ExpenseRouter.get(
  "/",
  authorize("ADMIN", "ACCOUNTANT"),
  listExpensesHandler,
);
ExpenseRouter.get(
  "/:id",
  authorize("ADMIN", "ACCOUNTANT"),
  getExpenseHandler,
);
ExpenseRouter.post(
  "/",
  authorize("ACCOUNTANT"),
  documentUpload.single("receipt"),
  verifyDocumentContents,
  createExpenseHandler,
);
ExpenseRouter.post(
  "/:id/reject",
  authorize("ADMIN"),
  rejectExpenseHandler,
);
ExpenseRouter.post(
  "/:id/approve/request",
  authorize("ADMIN"),
  payoutOtpLimiter,
  requestExpenseApprovalHandler,
);
ExpenseRouter.post(
  "/:id/approve/resend",
  authorize("ADMIN"),
  payoutOtpResendLimiter,
  resendExpenseApprovalHandler,
);
ExpenseRouter.post(
  "/:id/approve/confirm",
  authorize("ADMIN"),
  payoutConfirmLimiter,
  confirmExpenseApprovalHandler,
);

module.exports = ExpenseRouter;
