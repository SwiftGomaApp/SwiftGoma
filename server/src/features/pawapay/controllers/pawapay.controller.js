"use strict";

const { AppError } = require("../../../shared/errors/app.error");
const { catchAsync } = require("../../../shared/utils/catchAsync");
const pawapay = require("../services/pawapay.service");

function throwPawapayError(result, fallbackCode) {
  const reason = result?.data?.failureReason || result?.data?.rejectionReason;
  const message =
    reason?.failureMessage ||
    reason?.rejectionMessage ||
    result?.data?.message ||
    "La requête pawaPay a échoué.";
  const code = reason?.failureCode || reason?.rejectionCode || fallbackCode;

  const statusCode =
    result?.status && result.status < 500 ? result.status : 502;

  throw new AppError(message, statusCode, code);
}

const createDeposit = catchAsync(async (req, res) => {
  const {
    amount,
    currency,
    phoneNumber,
    provider,
    clientReferenceId,
    metadata,
  } = req.body;
  const result = await pawapay.initiateDeposit({
    amount,
    currency,
    phoneNumber,
    provider,
    clientReferenceId,
    metadata,
  });

  if (!result.ok) throwPawapayError(result, "PAWAPAY_DEPOSIT_FAILED");

  res.status(202).json({ success: true, data: result.data });
});

const getDepositStatus = catchAsync(async (req, res) => {
  const result = await pawapay.checkDepositStatus(req.params.depositId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_DEPOSIT_STATUS_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const resendDepositCallback = catchAsync(async (req, res) => {
  const result = await pawapay.resendDepositCallback(req.params.depositId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_RESEND_CALLBACK_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const handleDepositCallback = catchAsync(async (req, res) => {
  const callback = req.body;
  // TODO: verify signature here if signedCallbacks is enabled (RFC-9421 headers)
  // TODO: idempotently update your DB using callback.depositId + callback.status
  console.log("[pawapay] deposit callback:", callback);
  res.sendStatus(200);
});

const createPayout = catchAsync(async (req, res) => {
  const {
    amount,
    currency,
    phoneNumber,
    provider,
    clientReferenceId,
    metadata,
  } = req.body;
  const result = await pawapay.initiatePayout({
    amount,
    currency,
    phoneNumber,
    provider,
    clientReferenceId,
    metadata,
  });

  if (!result.ok) throwPawapayError(result, "PAWAPAY_PAYOUT_FAILED");

  res.status(202).json({ success: true, data: result.data });
});

const createBulkPayouts = catchAsync(async (req, res) => {
  const { payouts } = req.body;
  const result = await pawapay.initiateBulkPayouts(payouts);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_BULK_PAYOUT_FAILED");

  res.status(202).json({ success: true, data: result.data });
});

const getPayoutStatus = catchAsync(async (req, res) => {
  const result = await pawapay.checkPayoutStatus(req.params.payoutId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_PAYOUT_STATUS_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const resendPayoutCallback = catchAsync(async (req, res) => {
  const result = await pawapay.resendPayoutCallback(req.params.payoutId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_RESEND_CALLBACK_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const cancelPayout = catchAsync(async (req, res) => {
  const result = await pawapay.cancelEnqueuedPayout(req.params.payoutId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_CANCEL_PAYOUT_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const handlePayoutCallback = catchAsync(async (req, res) => {
  console.log("[pawapay] payout callback:", req.body);
  res.sendStatus(200);
});

/* ── REFUNDS ──────────────────────────────────────────────────────────── */

const createRefund = catchAsync(async (req, res) => {
  const { depositId, amount, metadata, currency } = req.body;
  const result = await pawapay.initiateRefund({
    depositId,
    amount,
    metadata,
    currency,
  });

  if (!result.ok) throwPawapayError(result, "PAWAPAY_REFUND_FAILED");

  res.status(202).json({ success: true, data: result.data });
});

const getRefundStatus = catchAsync(async (req, res) => {
  const result = await pawapay.checkRefundStatus(req.params.refundId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_REFUND_STATUS_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const resendRefundCallback = catchAsync(async (req, res) => {
  const result = await pawapay.resendRefundCallback(req.params.refundId);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_RESEND_CALLBACK_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const handleRefundCallback = catchAsync(async (req, res) => {
  console.log("[pawapay] refund callback:", req.body);
  res.sendStatus(200);
});

/* ── WALLET & TOOLKIT ─────────────────────────────────────────────────── */

const getWalletBalances = catchAsync(async (req, res) => {
  const result = await pawapay.walletBalances(req.query.country);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_WALLET_BALANCES_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const getActiveConfig = catchAsync(async (req, res) => {
  const result = await pawapay.activeConfig({
    country: req.query.country,
    operationType: req.query.operationType,
  });

  if (!result.ok) throwPawapayError(result, "PAWAPAY_ACTIVE_CONFIG_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const getProviderAvailability = catchAsync(async (req, res) => {
  const result = await pawapay.providerAvailability({
    country: req.query.country,
    operationType: req.query.operationType,
  });

  if (!result.ok) throwPawapayError(result, "PAWAPAY_AVAILABILITY_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

const predictProvider = catchAsync(async (req, res) => {
  const result = await pawapay.predictProvider(req.body.phoneNumber);

  if (!result.ok) throwPawapayError(result, "PAWAPAY_PREDICT_PROVIDER_FAILED");

  res.status(200).json({ success: true, data: result.data });
});

module.exports = {
  // deposits
  createDeposit,
  getDepositStatus,
  resendDepositCallback,
  handleDepositCallback,
  // payouts
  createPayout,
  createBulkPayouts,
  getPayoutStatus,
  resendPayoutCallback,
  cancelPayout,
  handlePayoutCallback,
  // refunds
  createRefund,
  getRefundStatus,
  resendRefundCallback,
  handleRefundCallback,
  // wallet & toolkit
  getWalletBalances,
  getActiveConfig,
  getProviderAvailability,
  predictProvider,
};
