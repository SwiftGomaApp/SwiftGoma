const crypto = require("crypto");
const { prisma } = require("../../../config/db.config");
const { AppError } = require("../../../shared/errors/app.error");
const { pawapayRequest } = require("../utils/pawapay.client");

const VALID_DEPOSIT_PURPOSES = [
  "SUBSCRIPTION",
  "ORDER_PAYMENT",
  "WALLET_TOPUP",
];

const TERMINAL_STATUSES = [
  "COMPLETED",
  "FAILED",
  "REJECTED",
  "DUPLICATE_IGNORED",
];

const validateLinkedId = ({
  purpose,
  subscriptionId,
  orderId,
  sellerProfileId,
}) => {
  if (purpose === "SUBSCRIPTION" && !subscriptionId) {
    throw new AppError(
      "subscriptionId is required for purpose SUBSCRIPTION.",
      400,
      "MISSING_LINKED_ID",
    );
  }
  if (purpose === "ORDER_PAYMENT" && !orderId) {
    throw new AppError(
      "orderId is required for purpose ORDER_PAYMENT.",
      400,
      "MISSING_LINKED_ID",
    );
  }
  if (
    (purpose === "WALLET_TOPUP" || purpose === "WALLET_PAYOUT") &&
    !sellerProfileId
  ) {
    throw new AppError(
      `sellerProfileId is required for purpose ${purpose}.`,
      400,
      "MISSING_LINKED_ID",
    );
  }
};

const initiateDeposit = async ({
  purpose,
  amount,
  currency,
  correspondent,
  country,
  phoneNumber,
  clientReferenceId,
  subscriptionId = null,
  orderId = null,
  sellerProfileId = null,
  customerMessage = "SwiftGoma",
}) => {
  if (!VALID_DEPOSIT_PURPOSES.includes(purpose)) {
    throw new AppError(
      `initiateDeposit does not support purpose "${purpose}". Valid: ${VALID_DEPOSIT_PURPOSES.join(", ")}.`,
      400,
      "INVALID_PURPOSE",
    );
  }
  validateLinkedId({ purpose, subscriptionId, orderId, sellerProfileId });

  const depositId = crypto.randomUUID();

  await prisma.pawaPayTransaction.create({
    data: {
      id: depositId,
      type: "DEPOSIT",
      purpose,
      status: "PENDING",
      amount,
      currency,
      correspondent,
      country,
      phoneNumber,
      clientReferenceId,
      subscriptionId,
      orderId,
      sellerProfileId,
    },
  });

  let response;
  try {
    response = await pawapayRequest("POST", "/v2/deposits", {
      depositId,
      payer: {
        type: "MMO",
        accountDetails: { phoneNumber, provider: correspondent },
      },
      amount,
      currency,
      clientReferenceId,
      customerMessage,
    });
  } catch (err) {
    await prisma.pawaPayTransaction.update({
      where: { id: depositId },
      data: { status: "REJECTED", failureReason: { message: err.message } },
    });
    throw err;
  }

  return prisma.pawaPayTransaction.update({
    where: { id: depositId },
    data: { status: response.status },
  });
};

const checkDepositStatus = (depositId) =>
  pawapayRequest("GET", `/v2/deposits/${depositId}`, null);

const resendDepositCallback = (depositId) =>
  pawapayRequest("POST", `/v2/deposits/${depositId}/resend-callback`, {});

// ══════════════════════════════════════════════════════════════════════════
// PAYOUTS (money OUT — currently wallet withdrawals only)
// ══════════════════════════════════════════════════════════════════════════

const initiatePayout = async ({
  amount,
  currency,
  correspondent,
  country,
  phoneNumber,
  clientReferenceId,
  sellerProfileId,
  statementDescription = "SwiftGoma",
}) => {
  validateLinkedId({ purpose: "WALLET_PAYOUT", sellerProfileId });

  const payoutId = crypto.randomUUID();

  await prisma.pawaPayTransaction.create({
    data: {
      id: payoutId,
      type: "PAYOUT",
      purpose: "WALLET_PAYOUT",
      status: "PENDING",
      amount,
      currency,
      correspondent,
      country,
      phoneNumber,
      clientReferenceId,
      sellerProfileId,
    },
  });

  let response;
  try {
    response = await pawapayRequest("POST", "/v2/payouts", {
      payoutId,
      recipient: {
        type: "MMO",
        accountDetails: { phoneNumber, provider: correspondent },
      },
      amount,
      currency,
      clientReferenceId,
      statementDescription,
    });
  } catch (err) {
    await prisma.pawaPayTransaction.update({
      where: { id: payoutId },
      data: { status: "REJECTED", failureReason: { message: err.message } },
    });
    throw err;
  }

  return prisma.pawaPayTransaction.update({
    where: { id: payoutId },
    data: { status: response.status },
  });
};

const checkPayoutStatus = (payoutId) =>
  pawapayRequest("GET", `/v2/payouts/${payoutId}`, null);

const resendPayoutCallback = (payoutId) =>
  pawapayRequest("POST", `/v2/payouts/${payoutId}/resend-callback`, {});

const cancelEnqueuedPayout = (payoutId) =>
  pawapayRequest("POST", `/v2/payouts/${payoutId}/cancel`, {});

const initiateBulkPayouts = (payouts) =>
  pawapayRequest("POST", "/v2/payouts/bulk", { payouts });

// ══════════════════════════════════════════════════════════════════════════
// REFUNDS
// ══════════════════════════════════════════════════════════════════════════

const initiateRefund = async ({ depositId, amount = null }) => {
  const original = await prisma.pawaPayTransaction.findUnique({
    where: { id: depositId },
  });

  if (!original) {
    throw new AppError(
      `No PawaPayTransaction found for depositId ${depositId}.`,
      404,
      "TRANSACTION_NOT_FOUND",
    );
  }
  if (original.type !== "DEPOSIT") {
    throw new AppError(
      `Transaction ${depositId} is not a DEPOSIT — cannot refund a ${original.type}.`,
      400,
      "INVALID_REFUND_TARGET",
    );
  }
  if (original.status !== "COMPLETED") {
    throw new AppError(
      `Transaction ${depositId} has status ${original.status} — only COMPLETED deposits can be refunded.`,
      400,
      "DEPOSIT_NOT_COMPLETED",
    );
  }

  const refundId = crypto.randomUUID();

  await prisma.pawaPayTransaction.create({
    data: {
      id: refundId,
      type: "REFUND",
      purpose: original.purpose,
      status: "PENDING",
      amount: amount || original.amount,
      currency: original.currency,
      correspondent: original.correspondent,
      country: original.country,
      phoneNumber: original.phoneNumber,
      clientReferenceId: original.clientReferenceId,
      subscriptionId: original.subscriptionId,
      orderId: original.orderId,
      sellerProfileId: original.sellerProfileId,
    },
  });

  let response;
  try {
    response = await pawapayRequest("POST", "/v2/refunds", {
      refundId,
      depositId,
      ...(amount && { amount }),
    });
  } catch (err) {
    await prisma.pawaPayTransaction.update({
      where: { id: refundId },
      data: { status: "REJECTED", failureReason: { message: err.message } },
    });
    throw err;
  }

  return prisma.pawaPayTransaction.update({
    where: { id: refundId },
    data: { status: response.status },
  });
};

const checkRefundStatus = (refundId) =>
  pawapayRequest("GET", `/v2/refunds/${refundId}`, null);

const resendRefundCallback = (refundId) =>
  pawapayRequest("POST", `/v2/refunds/${refundId}/resend-callback`, {});

// ══════════════════════════════════════════════════════════════════════════
// RECONCILIATION — for a periodic cron, not routine per-request use
// ══════════════════════════════════════════════════════════════════════════

const TYPE_CHECK_FN = {
  DEPOSIT: checkDepositStatus,
  PAYOUT: checkPayoutStatus,
  REFUND: checkRefundStatus,
};

const syncTransactionStatus = async (transactionId) => {
  const existing = await prisma.pawaPayTransaction.findUnique({
    where: { id: transactionId },
  });
  if (!existing) {
    throw new AppError(
      `No PawaPayTransaction found for id ${transactionId}.`,
      404,
      "TRANSACTION_NOT_FOUND",
    );
  }
  if (TERMINAL_STATUSES.includes(existing.status)) {
    return existing;
  }

  const checkFn = TYPE_CHECK_FN[existing.type];
  const response = await checkFn(transactionId);
  const remoteData = response.data;

  if (!remoteData) return existing;

  return prisma.pawaPayTransaction.update({
    where: { id: transactionId },
    data: {
      status: remoteData.status,
      providerTransactionId:
        remoteData.providerTransactionId || existing.providerTransactionId,
      failureReason: remoteData.failureReason || existing.failureReason,
      rawCallbackPayload: remoteData,
      completedAt: TERMINAL_STATUSES.includes(remoteData.status)
        ? new Date()
        : null,
    },
  });
};

// ══════════════════════════════════════════════════════════════════════════
// WALLET & TOOLKIT — read-only, no DB rows involved
// ══════════════════════════════════════════════════════════════════════════

const getWalletBalances = (country = null) => {
  const query = country ? `?country=${country}` : "";
  return pawapayRequest("GET", `/v2/wallet-balances${query}`, null);
};

const getActiveConfiguration = ({
  country = null,
  operationType = null,
} = {}) => {
  const params = [];
  if (country) params.push(`country=${country}`);
  if (operationType) params.push(`operationType=${operationType}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return pawapayRequest("GET", `/v2/active-conf${query}`, null);
};

const getProviderAvailability = ({
  country = null,
  operationType = null,
} = {}) => {
  const params = [];
  if (country) params.push(`country=${country}`);
  if (operationType) params.push(`operationType=${operationType}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return pawapayRequest("GET", `/v2/availability${query}`, null);
};

const predictProvider = (phoneNumber) =>
  pawapayRequest("POST", "/v2/predict-provider", { phoneNumber });

module.exports = {
  // deposits
  initiateDeposit,
  checkDepositStatus,
  resendDepositCallback,
  // payouts
  initiatePayout,
  checkPayoutStatus,
  resendPayoutCallback,
  cancelEnqueuedPayout,
  initiateBulkPayouts,
  // refunds
  initiateRefund,
  checkRefundStatus,
  resendRefundCallback,
  // reconciliation
  syncTransactionStatus,
  // wallet & toolkit
  getWalletBalances,
  getActiveConfiguration,
  getProviderAvailability,
  predictProvider,
};
