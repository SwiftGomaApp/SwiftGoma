const express = require("express");
const {
  postInitiateDeposit,
  getDepositStatus,
  postRequestPayoutApproval,
  postConfirmPayout,
  postRequestRefundApproval,
  postConfirmRefund,
  getPayoutHistory,
  getPayoutStatus,
  postInitiateRefund,
  getRefundStatus,
  getBalances,
  getConfiguration,
} = require("../controllers/pawapay.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  payoutOtpLimiter,
  payoutConfirmLimiter,
  paymentLimiter,
} = require("../../../common/middleware/rateLimiters");
const { idempotencyGuard } = require("../../../common/middleware/idempotency");

const FINANCE_READ = authorize("ADMIN", "ACCOUNTANT");

const PawapayRouter = express.Router();

PawapayRouter.use(authenticate);

PawapayRouter.post(
  "/deposits",
  authorize("ADMIN"),
  paymentLimiter,
  idempotencyGuard({ scope: "pawapay-deposit" }),
  postInitiateDeposit,
);
PawapayRouter.get("/deposits/:depositId", FINANCE_READ, getDepositStatus);
PawapayRouter.post(
  "/payouts/request-approval",
  authorize("ADMIN"),
  payoutOtpLimiter,
  postRequestPayoutApproval,
);
PawapayRouter.post(
  "/payouts/confirm",
  authorize("ADMIN"),
  payoutConfirmLimiter,
  idempotencyGuard({ scope: "pawapay-payout-confirm" }),
  postConfirmPayout,
);
PawapayRouter.get("/payouts/history", FINANCE_READ, getPayoutHistory);
PawapayRouter.get("/payouts/:payoutId", FINANCE_READ, getPayoutStatus);
PawapayRouter.post(
  "/refunds/request-approval",
  authorize("ADMIN"),
  payoutOtpLimiter,
  postRequestRefundApproval,
);
PawapayRouter.post(
  "/refunds/confirm",
  authorize("ADMIN"),
  payoutConfirmLimiter,
  idempotencyGuard({ scope: "pawapay-refund-confirm" }),
  postConfirmRefund,
);
PawapayRouter.post(
  "/refunds",
  authorize("ADMIN"),
  idempotencyGuard({ scope: "pawapay-refund-initiate" }),
  postInitiateRefund,
);
PawapayRouter.get("/refunds/:refundId", FINANCE_READ, getRefundStatus);
PawapayRouter.get("/wallet-balances", FINANCE_READ, getBalances);
PawapayRouter.get("/active-configuration", FINANCE_READ, getConfiguration);

module.exports = PawapayRouter;
