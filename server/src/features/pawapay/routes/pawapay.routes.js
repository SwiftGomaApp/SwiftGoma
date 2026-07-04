"use strict";

const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const pawapayController = require("../controllers/pawapay.controller");

const router = express.Router();

router.post("/callbacks/deposit", pawapayController.handleDepositCallback);
router.post("/callbacks/payout", pawapayController.handlePayoutCallback);
router.post("/callbacks/refund", pawapayController.handleRefundCallback);

router.use(authenticate);

// ─── Deposits (a buyer paying) ─────────────────────────────────────────────

router.post("/deposits", requireVerified, pawapayController.createDeposit);
router.get(
  "/deposits/:depositId",
  requireVerified,
  pawapayController.getDepositStatus,
);
router.get(
  "/deposits/:depositId/resend-callback",
  requireVerified,
  pawapayController.resendDepositCallback,
);

// ─── Payouts (disbursing YOUR wallet — admin/support only) ─────────────────

router.post("/payouts", requireRole("ADMIN"), pawapayController.createPayout);
router.post(
  "/payouts/bulk",
  requireRole("ADMIN"),
  pawapayController.createBulkPayouts,
);
router.get(
  "/payouts/:payoutId",
  requireRole("ADMIN", "SUPPORT"),
  pawapayController.getPayoutStatus,
);
router.get(
  "/payouts/:payoutId/resend-callback",
  requireRole("ADMIN", "SUPPORT"),
  pawapayController.resendPayoutCallback,
);
router.post(
  "/payouts/:payoutId/cancel",
  requireRole("ADMIN"),
  pawapayController.cancelPayout,
);

// ─── Refunds (admin/support decision, not self-serve for buyers) ──────────

router.post(
  "/refunds",
  requireRole("ADMIN", "SUPPORT"),
  pawapayController.createRefund,
);
router.get(
  "/refunds/:refundId",
  requireRole("ADMIN", "SUPPORT"),
  pawapayController.getRefundStatus,
);
router.get(
  "/refunds/:refundId/resend-callback",
  requireRole("ADMIN", "SUPPORT"),
  pawapayController.resendRefundCallback,
);

router.get(
  "/active-config",
  requireVerified,
  pawapayController.getActiveConfig,
);
router.get(
  "/availability",
  requireVerified,
  pawapayController.getProviderAvailability,
);
router.post(
  "/predict-provider",
  requireVerified,
  pawapayController.predictProvider,
);

router.get(
  "/wallet-balances",
  requireRole("ADMIN"),
  pawapayController.getWalletBalances,
);

module.exports = { pawapayRouter: router };
