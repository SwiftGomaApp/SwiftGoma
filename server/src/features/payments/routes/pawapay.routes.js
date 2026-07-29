const express = require("express");
const {
  postInitiateDeposit,
  getDepositStatus,
  postInitiatePayout,
  getPayoutStatus,
  postInitiateRefund,
  getRefundStatus,
  getBalances,
  getConfiguration,
} = require("../controllers/pawapay.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const PawapayRouter = express.Router();

PawapayRouter.use(authenticate);

PawapayRouter.post("/deposits", authorize("ADMIN"), postInitiateDeposit);
PawapayRouter.get("/deposits/:depositId", authorize("ADMIN"), getDepositStatus);
PawapayRouter.post("/payouts", authorize("ADMIN"), postInitiatePayout);
PawapayRouter.get("/payouts/:payoutId", authorize("ADMIN"), getPayoutStatus);
PawapayRouter.post("/refunds", authorize("ADMIN"), postInitiateRefund);
PawapayRouter.get("/refunds/:refundId", authorize("ADMIN"), getRefundStatus);
PawapayRouter.get("/wallet-balances", authorize("ADMIN"), getBalances);
PawapayRouter.get("/active-configuration", getConfiguration);

module.exports = PawapayRouter;
