const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const { prisma } = require("../../../config/db.config");
const pawapayService = require("../services/pawapay.service");

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "DUPLICATE_IGNORED",
];

const applySideEffects = async (transaction) => {
  switch (transaction.purpose) {
    case "SUBSCRIPTION":
      console.log(
        `TODO: subscription side effects for ${transaction.id} -> ${transaction.status}`,
      );
      break;
    case "ORDER_PAYMENT":
      console.log(
        `TODO: order payment side effects for ${transaction.id} -> ${transaction.status}`,
      );
      break;
    case "WALLET_TOPUP":
      console.log(
        `TODO: wallet topup side effects for ${transaction.id} -> ${transaction.status}`,
      );
      break;
    case "WALLET_PAYOUT":
      console.log(
        `TODO: wallet payout side effects for ${transaction.id} -> ${transaction.status}`,
      );
      break;
    default:
      console.warn(
        `Unknown PawaPayTransaction purpose: ${transaction.purpose}`,
      );
  }
};

const processCallback = async ({ id, expectedType, body, label }) => {
  const existing = await prisma.pawaPayTransaction.findUnique({
    where: { id },
  });

  if (!existing) {
    console.error(`${label} callback for unknown transaction id=${id}`);
    return { status: 200, body: { received: true } };
  }

  if (existing.type !== expectedType) {
    // Signature was valid, but the id belongs to a transaction of the WRONG
    // type for this endpoint (e.g. a deposit id sent to /callbacks/payouts).
    // Don't process it — ack so PawaPay doesn't retry forever, but log loudly.
    console.error(
      `${label} callback for id=${id} but stored type is ${existing.type}, expected ${expectedType} — mismatched endpoint?`,
    );
    return { status: 200, body: { received: true, typeMismatch: true } };
  }

  if (TERMINAL_STATUSES.includes(existing.status)) {
    return { status: 200, body: { received: true, alreadyProcessed: true } };
  }

  const updated = await prisma.pawaPayTransaction.update({
    where: { id },
    data: {
      status: body.status,
      providerTransactionId: body.providerTransactionId || null,
      failureReason: body.failureReason || undefined,
      rawCallbackPayload: body,
      completedAt: TERMINAL_STATUSES.includes(body.status) ? new Date() : null,
    },
  });

  if (TERMINAL_STATUSES.includes(updated.status)) {
    await applySideEffects(updated);
  }

  return { status: 200, body: { received: true } };
};

const handleDepositCallback = catchAsync(async (req, res) => {
  const { depositId } = req.body;

  if (!depositId) {
    console.error("Deposit callback missing depositId:", req.body);
    return res.status(200).json({ received: true });
  }

  const result = await processCallback({
    id: depositId,
    expectedType: "DEPOSIT",
    body: req.body,
    label: "Deposit",
  });

  res.status(result.status).json(result.body);
});

const handlePayoutCallback = catchAsync(async (req, res) => {
  const { payoutId } = req.body;

  if (!payoutId) {
    console.error("Payout callback missing payoutId:", req.body);
    return res.status(200).json({ received: true });
  }

  const result = await processCallback({
    id: payoutId,
    expectedType: "PAYOUT",
    body: req.body,
    label: "Payout",
  });

  res.status(result.status).json(result.body);
});

const handleRefundCallback = catchAsync(async (req, res) => {
  const { refundId } = req.body;

  if (!refundId) {
    console.error("Refund callback missing refundId:", req.body);
    return res.status(200).json({ received: true });
  }

  const result = await processCallback({
    id: refundId,
    expectedType: "REFUND",
    body: req.body,
    label: "Refund",
  });

  res.status(result.status).json(result.body);
});

const getPlatformWalletBalance = catchAsync(async (req, res) => {
  const { country } = req.query;
  const result = await pawapayService.getWalletBalances(country || null);

  res.status(200).json({
    success: true,
    data: result,
  });
});

const getActiveConfigurationHandler = catchAsync(async (req, res) => {
  const { country, operationType } = req.query;

  if (
    operationType &&
    !["DEPOSIT", "PAYOUT", "REFUND"].includes(operationType)
  ) {
    throw errors.badRequest(
      "operationType doit être DEPOSIT, PAYOUT ou REFUND.",
    );
  }

  const result = await pawapayService.getActiveConfiguration({
    country: country || null,
    operationType: operationType || null,
  });

  res.status(200).json({ success: true, data: result });
});

const getProviderAvailabilityHandler = catchAsync(async (req, res) => {
  const { country, operationType } = req.query;

  if (
    operationType &&
    !["DEPOSIT", "PAYOUT", "REFUND"].includes(operationType)
  ) {
    throw errors.badRequest(
      "operationType doit être DEPOSIT, PAYOUT ou REFUND.",
    );
  }

  const result = await pawapayService.getProviderAvailability({
    country: country || null,
    operationType: operationType || null,
  });

  res.status(200).json({ success: true, data: result });
});

const predictProviderHandler = catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber)
    throw errors.badRequest("Le numéro de téléphone est requis.");

  const result = await pawapayService.predictProvider(phoneNumber);

  res.status(200).json({ success: true, data: result });
});

module.exports = {
  handleDepositCallback,
  handlePayoutCallback,
  handleRefundCallback,
  getPlatformWalletBalance,
  getActiveConfigurationHandler,
  getProviderAvailabilityHandler,
  predictProviderHandler,
};
