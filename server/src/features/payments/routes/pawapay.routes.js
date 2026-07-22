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

// Deposits — usage interne (appelé par subscription/order service),
// mais exposé ici pour test/debug ADMIN via Postman
PawapayRouter.post("/deposits", authorize("ADMIN"), postInitiateDeposit);
PawapayRouter.get("/deposits/:depositId", authorize("ADMIN"), getDepositStatus);

// Payouts — ADMIN only, vu que ça déplace de l'argent réel vers l'extérieur
PawapayRouter.post("/payouts", authorize("ADMIN"), postInitiatePayout);
PawapayRouter.get("/payouts/:payoutId", authorize("ADMIN"), getPayoutStatus);

// Refunds — ADMIN only
PawapayRouter.post("/refunds", authorize("ADMIN"), postInitiateRefund);
PawapayRouter.get("/refunds/:refundId", authorize("ADMIN"), getRefundStatus);

// Wallet / config — ADMIN only, infos financières internes
PawapayRouter.get("/wallet-balances", authorize("ADMIN"), getBalances);
PawapayRouter.get(
  "/active-configuration",
  // authorize("ADMIN"),
  getConfiguration,
);

module.exports = PawapayRouter;
