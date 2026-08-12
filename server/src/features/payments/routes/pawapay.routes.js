const express = require("express");
const {
  postInitiateDeposit,
  getDepositStatus,
  postInitiatePayout,
  postRequestPayoutApproval,
  postConfirmPayout,
  getPayoutHistory,
  getPayoutStatus,
  postInitiateRefund,
  getRefundStatus,
  getBalances,
  getConfiguration,
} = require("../controllers/pawapay.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const FINANCE_READ = authorize("ADMIN", "ACCOUNTANT");

const PawapayRouter = express.Router();

PawapayRouter.use(authenticate);

PawapayRouter.post("/deposits", authorize("ADMIN"), postInitiateDeposit);
PawapayRouter.get("/deposits/:depositId", FINANCE_READ, getDepositStatus);
PawapayRouter.post("/payouts", authorize("ADMIN"), postInitiatePayout);
PawapayRouter.post(
  "/payouts/request-approval",
  authorize("ADMIN"),
  postRequestPayoutApproval,
);
PawapayRouter.post("/payouts/confirm", authorize("ADMIN"), postConfirmPayout);
PawapayRouter.get("/payouts/history", FINANCE_READ, getPayoutHistory);
PawapayRouter.get("/payouts/:payoutId", FINANCE_READ, getPayoutStatus);
PawapayRouter.post("/refunds", authorize("ADMIN"), postInitiateRefund);
PawapayRouter.get("/refunds/:refundId", FINANCE_READ, getRefundStatus);
PawapayRouter.get("/wallet-balances", FINANCE_READ, getBalances);
PawapayRouter.get("/active-configuration", getConfiguration);

module.exports = PawapayRouter;
