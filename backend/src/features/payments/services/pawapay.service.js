const crypto = require("crypto");
const { pawapayClient, activeCountries } = require("../config/pawapay.config");
const { AppError } = require("../../../shared/errors/app.error");

const generateId = () => crypto.randomUUID();
const DEPOSIT_TYPES = ["SUBSCRIPTION", "ORDER", "WALLET_TOPUP"];

const assertCountrySupported = (country) => {
  if (!activeCountries.includes(country)) {
    throw new AppError(
      `Le pays "${country}" n'est pas activé pour les paiements Mobile Money.`,
      400,
      "PAWAPAY_COUNTRY_NOT_SUPPORTED",
    );
  }
};

const callPawapay = async (fn, { operation }) => {
  try {
    return await fn();
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      const message =
        data?.failureReason?.failureMessage ||
        data?.message ||
        `pawaPay a rejeté la requête (${operation}).`;

      throw new AppError(
        message,
        status >= 500 ? 502 : 400,
        "PAWAPAY_REQUEST_FAILED",
      );
    }
    console.error(`💥 pawaPay ${operation} error:`, err.message);
    throw new AppError(
      "Le service de paiement Mobile Money est momentanément indisponible.",
      503,
      "PAWAPAY_UNAVAILABLE",
    );
  }
};

// ================================== DEPOSIT ================================

const initiateDeposit = async ({
  amount,
  currency,
  phoneNumber,
  provider,
  depositType,
  referenceId,
  clientReferenceId,
  customerMessage,
  depositId,
}) => {
  if (!DEPOSIT_TYPES.includes(depositType)) {
    throw new AppError(
      `depositType invalide: "${depositType}". Valeurs acceptées: ${DEPOSIT_TYPES.join(", ")}.`,
      400,
      "INVALID_DEPOSIT_TYPE",
    );
  }

  const id = depositId || generateId();

  const metadata = [{ depositType }];
  if (referenceId) metadata.push({ referenceId });

  const payload = {
    depositId: id,
    payer: {
      type: "MMO",
      accountDetails: { phoneNumber, provider },
    },
    amount: String(amount),
    currency,
    ...(clientReferenceId && { clientReferenceId }),
    ...(customerMessage && { customerMessage }),
    metadata,
  };

  const { data } = await callPawapay(
    () => pawapayClient.post("/v2/deposits", payload),
    {
      operation: "initiateDeposit",
    },
  );

  return { ...data, depositId: id };
};

const checkDepositStatus = async (depositId) => {
  const { data } = await callPawapay(
    () => pawapayClient.get(`/v2/deposits/${depositId}`),
    {
      operation: "checkDepositStatus",
    },
  );
  return data;
};

const resendDepositCallback = async (depositId) => {
  const { data } = await callPawapay(
    () => pawapayClient.post("/deposits/resend-callback", { depositId }),
    { operation: "resendDepositCallback" },
  );
  return data;
};

// ================================== PAYOUTS ================================

const initiatePayout = async ({
  amount,
  currency,
  phoneNumber,
  provider,
  metadata,
  payoutId,
}) => {
  const id = payoutId || generateId();

  const payload = {
    payoutId: id,
    recipient: {
      type: "MMO",
      accountDetails: { phoneNumber, provider },
    },
    amount: String(amount),
    currency,
    ...(metadata && { metadata: [metadata] }),
  };

  const { data } = await callPawapay(
    () => pawapayClient.post("/v2/payouts", payload),
    {
      operation: "initiatePayout",
    },
  );

  return { ...data, payoutId: id };
};

const checkPayoutStatus = async (payoutId) => {
  const { data } = await callPawapay(
    () => pawapayClient.get(`/v2/payouts/${payoutId}`),
    {
      operation: "checkPayoutStatus",
    },
  );
  return data;
};

const cancelEnqueuedPayout = async (payoutId) => {
  const { data } = await callPawapay(
    () => pawapayClient.post(`/v2/payouts/fail-enqueued/${payoutId}`),
    { operation: "cancelEnqueuedPayout" },
  );
  return data;
};

// ================================== REFUND ================================

const initiateRefund = async ({ depositId, amount, metadata, refundId }) => {
  const id = refundId || generateId();

  const payload = {
    refundId: id,
    depositId,
    ...(amount && { amount: String(amount) }),
    ...(metadata && { metadata: [metadata] }),
  };

  const { data } = await callPawapay(
    () => pawapayClient.post("/v2/refunds", payload),
    {
      operation: "initiateRefund",
    },
  );

  return { ...data, refundId: id };
};

const checkRefundStatus = async (refundId) => {
  const { data } = await callPawapay(
    () => pawapayClient.get(`/v2/refunds/${refundId}`),
    {
      operation: "checkRefundStatus",
    },
  );
  return data;
};

// ================================== UTILITY ENDPOINTS ================================

const predictProvider = async (phoneNumber) => {
  const { data } = await callPawapay(
    () => pawapayClient.post("/v2/predict-provider", { phoneNumber }),
    { operation: "predictProvider" },
  );
  return data;
};

const getActiveConfiguration = async ({ country, operationType } = {}) => {
  const params = {};
  if (country) params.country = country;
  if (operationType) params.operationType = operationType;

  const { data } = await callPawapay(
    () => pawapayClient.get("/v2/active-conf", { params }),
    {
      operation: "getActiveConfiguration",
    },
  );
  return data;
};

const getWalletBalances = async (country) => {
  const { data } = await callPawapay(
    () =>
      pawapayClient.get("/v2/wallet-balances", {
        params: country ? { country } : {},
      }),
    { operation: "getWalletBalances" },
  );
  return data;
};

module.exports = {
  assertCountrySupported,
  initiateDeposit,
  checkDepositStatus,
  resendDepositCallback,
  initiatePayout,
  checkPayoutStatus,
  cancelEnqueuedPayout,
  initiateRefund,
  checkRefundStatus,
  predictProvider,
  getActiveConfiguration,
  getWalletBalances,
};
