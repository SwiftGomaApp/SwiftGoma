const { catchAsync } = require("../../../shared/utils/catchAsync");
const { AppError } = require("../../../shared/errors/app.error");
const pawapayService = require("../services/pawapay.service");

// ─── Deposits ───────────────────────────────────────────────────────────────

const testInitiateDeposit = catchAsync(async (req, res) => {
  const {
    amount,
    currency,
    phoneNumber,
    provider,
    depositType,
    referenceId,
    customerMessage,
  } = req.body;

  if (!amount || !currency || !phoneNumber || !provider || !depositType) {
    throw new AppError(
      "amount, currency, phoneNumber, provider et depositType sont requis.",
      400,
      "MISSING_FIELDS",
    );
  }

  const result = await pawapayService.initiateDeposit({
    amount,
    currency,
    phoneNumber,
    provider,
    depositType,
    referenceId,
    customerMessage,
  });

  res.status(200).json({ success: true, data: result });
});

const testCheckDepositStatus = catchAsync(async (req, res) => {
  const { depositId } = req.params;
  const result = await pawapayService.checkDepositStatus(depositId);
  res.status(200).json({ success: true, data: result });
});

const testResendDepositCallback = catchAsync(async (req, res) => {
  const { depositId } = req.params;
  const result = await pawapayService.resendDepositCallback(depositId);
  res.status(200).json({ success: true, data: result });
});

// ─── Payouts ────────────────────────────────────────────────────────────────

const testInitiatePayout = catchAsync(async (req, res) => {
  const { amount, currency, phoneNumber, provider } = req.body;

  if (!amount || !currency || !phoneNumber || !provider) {
    throw new AppError(
      "amount, currency, phoneNumber et provider sont requis.",
      400,
      "MISSING_FIELDS",
    );
  }

  const result = await pawapayService.initiatePayout({
    amount,
    currency,
    phoneNumber,
    provider,
  });
  res.status(200).json({ success: true, data: result });
});

const testCheckPayoutStatus = catchAsync(async (req, res) => {
  const { payoutId } = req.params;
  const result = await pawapayService.checkPayoutStatus(payoutId);
  res.status(200).json({ success: true, data: result });
});

const testCancelEnqueuedPayout = catchAsync(async (req, res) => {
  const { payoutId } = req.params;
  const result = await pawapayService.cancelEnqueuedPayout(payoutId);
  res.status(200).json({ success: true, data: result });
});

// ─── Refunds ────────────────────────────────────────────────────────────────

const testInitiateRefund = catchAsync(async (req, res) => {
  const { depositId, amount } = req.body;

  if (!depositId) {
    throw new AppError("depositId est requis.", 400, "MISSING_FIELDS");
  }

  const result = await pawapayService.initiateRefund({ depositId, amount });
  res.status(200).json({ success: true, data: result });
});

const testCheckRefundStatus = catchAsync(async (req, res) => {
  const { refundId } = req.params;
  const result = await pawapayService.checkRefundStatus(refundId);
  res.status(200).json({ success: true, data: result });
});

// ─── Utility endpoints ──────────────────────────────────────────────────────

const testPredictProvider = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new AppError("phoneNumber est requis.", 400, "MISSING_FIELDS");
  }

  const result = await pawapayService.predictProvider(phoneNumber);
  res.status(200).json({ success: true, data: result });
});

const testGetActiveConfiguration = catchAsync(async (req, res) => {
  const { country, operationType } = req.query;
  const result = await pawapayService.getActiveConfiguration({
    country,
    operationType,
  });
  res.status(200).json({ success: true, data: result });
});

const testGetWalletBalances = catchAsync(async (req, res) => {
  const { country } = req.query;
  const result = await pawapayService.getWalletBalances(country);
  res.status(200).json({ success: true, data: result });
});

module.exports = {
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
};
