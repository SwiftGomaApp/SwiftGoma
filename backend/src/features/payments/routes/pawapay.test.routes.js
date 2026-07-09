const express = require("express");
const {
  testInitiateDeposit,
  testCheckDepositStatus,
  testResendDepositCallback,
  testInitiatePayout,
  testCheckPayoutStatus,
  testCancelEnqueuedPayout,
  testInitiateRefund,
  testCheckRefundStatus,
  testPredictProvider,
  testGetActiveConfiguration,
  testGetWalletBalances,
} = require("../controllers/pawapay.test.controller");

const router = express.Router();

// Deposits
router.post("/deposits", testInitiateDeposit);
router.get("/deposits/:depositId", testCheckDepositStatus);
router.post("/deposits/:depositId/resend-callback", testResendDepositCallback);

// Payouts
router.post("/payouts", testInitiatePayout);
router.get("/payouts/:payoutId", testCheckPayoutStatus);
router.post("/payouts/:payoutId/cancel", testCancelEnqueuedPayout);

// Refunds
router.post("/refunds", testInitiateRefund);
router.get("/refunds/:refundId", testCheckRefundStatus);

// Utility
router.post("/predict-provider", testPredictProvider);
router.get("/active-configuration", testGetActiveConfiguration);
router.get("/wallet-balances", testGetWalletBalances);

module.exports = { pawapayTestRouter: router };
