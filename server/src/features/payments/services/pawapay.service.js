const { client, getBaseUrl } = require("../config/pawapay.config");
const {
  generateTransactionId,
  isValidAmount,
  formatAmount,
  isValidMsisdn,
  isValidStatementDescription,
  buildMetadata,
} = require("../utils/pawapay.utils");
const { ValidationError, AppError } = require("../../../common/errors");
const { signFinancialRequest } = require("../utils/pawapay.signature");
const { env } = require("../../../config/env");

async function postSigned(path, payload) {
  const bodyString = JSON.stringify(payload);

  if (!env.pawapay.signingEnabled) {
    return client.post(path, payload);
  }

  const signedHeaders = await signFinancialRequest({
    method: "POST",
    path,
    bodyString,
  });

  return client.post(path, bodyString, { headers: signedHeaders });
}

async function resolveDecimalsInAmount({
  country,
  provider,
  currency,
  operationType = "DEPOSIT",
}) {
  const config = await getActiveConfiguration({ country });

  const countryConfig = config?.countries?.find((c) => c.country === country);
  const providerConfig = countryConfig?.providers?.find(
    (p) => p.provider === provider,
  );
  const currencyConfig = providerConfig?.currencies?.find(
    (c) => c.currency === currency,
  );
  const operationConfig = currencyConfig?.operationTypes?.[operationType];

  if (!operationConfig) {
    throw new AppError(
      `No active configuration found for ${provider} / ${currency} / ${operationType} in ${country}.`,
      400,
      "PAWAPAY_PROVIDER_NOT_CONFIGURED",
    );
  }

  return operationConfig.decimalsInAmount;
}

async function initiateDeposit({
  amount,
  currency,
  country,
  provider,
  payerPhoneNumber,
  customerMessage,
  clientReferenceId,
  metadata = {},
  // Per docs.pawapay.io/v2/docs/signatures.md + the deposit/payout/refund
  // API reference: "This API call is idempotent — it is safe to submit a
  // request with the same depositId multiple times" (duplicates come back
  // as DUPLICATE_IGNORED, no new deposit is created). Callers that already
  // have a stable internal record for this payment (e.g. a
  // SubscriptionPayment row) should pass its id here so that a retry of
  // this exact logical operation can't create a second real deposit at
  // PawaPay — falls back to a fresh UUID for callers with no such record
  // (e.g. the admin-only direct PawaPay endpoints).
  depositId: requestedDepositId,
}) {
  if (!isValidAmount(amount))
    throw new ValidationError("Invalid deposit amount.");
  if (!isValidMsisdn(payerPhoneNumber))
    throw new ValidationError("Invalid payer phone number.");
  if (!isValidStatementDescription(customerMessage)) {
    throw new ValidationError(
      "customerMessage must be 4-22 alphanumeric characters.",
    );
  }
  if (!provider)
    throw new ValidationError("Missing provider (mobile money operator).");

  const decimalsInAmount = await resolveDecimalsInAmount({
    country,
    provider,
    currency,
    operationType: "DEPOSIT",
  });
  const depositId = requestedDepositId || generateTransactionId();

  const payload = {
    depositId,
    payer: {
      type: "MMO",
      accountDetails: { phoneNumber: payerPhoneNumber, provider },
    },
    amount: formatAmount(amount, decimalsInAmount),
    currency,
    ...(clientReferenceId ? { clientReferenceId } : {}),
    customerMessage,
    metadata: buildMetadata(metadata),
  };

  try {
    const res = await postSigned("/v2/deposits", payload);
    return { depositId, ...res.data };
  } catch (err) {
    console.error(
      "[pawapay] initiateDeposit failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to initiate deposit.",
      502,
      "PAWAPAY_DEPOSIT_FAILED",
    );
  }
}

async function checkDepositStatus(depositId) {
  try {
    const res = await client.get(`/v2/deposits/${depositId}`);
    return res.data;
  } catch (err) {
    console.error(
      "[pawapay] checkDepositStatus failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to check deposit status.",
      502,
      "PAWAPAY_STATUS_CHECK_FAILED",
    );
  }
}

async function initiatePayout({
  amount,
  currency,
  country,
  provider,
  recipientPhoneNumber,
  customerMessage,
  clientReferenceId,
  metadata = {},
  // Same idempotency contract as initiateDeposit's `depositId` override —
  // pass the internal record id for this payout when one exists.
  payoutId: requestedPayoutId,
}) {
  if (!isValidAmount(amount))
    throw new ValidationError("Invalid payout amount.");
  if (!isValidMsisdn(recipientPhoneNumber))
    throw new ValidationError("Invalid recipient phone number.");
  if (!isValidStatementDescription(customerMessage)) {
    throw new ValidationError(
      "customerMessage must be 4-22 alphanumeric characters.",
    );
  }
  if (!provider)
    throw new ValidationError("Missing provider (mobile money operator).");

  const decimalsInAmount = await resolveDecimalsInAmount({
    country,
    provider,
    currency,
    operationType: "PAYOUT",
  });
  const payoutId = requestedPayoutId || generateTransactionId();

  const payload = {
    payoutId,
    recipient: {
      type: "MMO",
      accountDetails: { phoneNumber: recipientPhoneNumber, provider },
    },
    amount: formatAmount(amount, decimalsInAmount),
    currency,
    ...(clientReferenceId ? { clientReferenceId } : {}),
    customerMessage,
    metadata: buildMetadata(metadata),
  };

  try {
    const res = await postSigned("/v2/payouts", payload);
    return { payoutId, ...res.data };
  } catch (err) {
    console.error(
      "[pawapay] initiatePayout failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to initiate payout.",
      502,
      "PAWAPAY_PAYOUT_FAILED",
    );
  }
}

async function checkPayoutStatus(payoutId) {
  try {
    const res = await client.get(`/v2/payouts/${payoutId}`);
    return res.data;
  } catch (err) {
    console.error(
      "[pawapay] checkPayoutStatus failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to check payout status.",
      502,
      "PAWAPAY_STATUS_CHECK_FAILED",
    );
  }
}

async function initiateRefund({
  depositId,
  amount,
  currency,
  country,
  provider,
  metadata = {},
  // Same idempotency contract as initiateDeposit's `depositId` override —
  // pass the internal record id for this refund when one exists.
  refundId: requestedRefundId,
}) {
  if (!depositId) throw new ValidationError("Missing depositId to refund.");
  if (amount !== undefined && !isValidAmount(amount))
    throw new ValidationError("Invalid refund amount.");

  let formattedAmount;
  if (amount !== undefined) {
    const decimalsInAmount = await resolveDecimalsInAmount({
      country,
      provider,
      currency,
      operationType: "REFUND",
    });
    formattedAmount = formatAmount(amount, decimalsInAmount);
  }

  const refundId = requestedRefundId || generateTransactionId();

  const payload = {
    refundId,
    depositId,
    ...(formattedAmount !== undefined ? { amount: formattedAmount } : {}),
    metadata: buildMetadata(metadata),
  };

  try {
    const res = await postSigned("/v2/refunds", payload);
    return { refundId, ...res.data };
  } catch (err) {
    console.error(
      "[pawapay] initiateRefund failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to initiate refund.",
      502,
      "PAWAPAY_REFUND_FAILED",
    );
  }
}

async function checkRefundStatus(refundId) {
  try {
    const res = await client.get(`/v2/refunds/${refundId}`);
    return res.data;
  } catch (err) {
    console.error(
      "[pawapay] checkRefundStatus failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to check refund status.",
      502,
      "PAWAPAY_STATUS_CHECK_FAILED",
    );
  }
}

async function getWalletBalances() {
  try {
    const res = await client.get("/v2/wallet-balances");
    return res.data;
  } catch (err) {
    console.error(
      "[pawapay] getWalletBalances failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch wallet balances.",
      502,
      "PAWAPAY_BALANCE_FETCH_FAILED",
    );
  }
}

async function getActiveConfiguration({
  country,
  operationType,
  currency,
} = {}) {
  try {
    const params = {};
    if (country) params.country = country;
    if (operationType) params.operationType = operationType;

    const res = await client.get("/v2/active-conf", { params });

    if (!currency) return res.data;

    const filtered = {
      ...res.data,
      countries: (res.data.countries || []).map((c) => ({
        ...c,
        providers: (c.providers || [])
          .map((p) => ({
            ...p,
            currencies: (p.currencies || []).filter(
              (cur) => cur.currency === currency,
            ),
          }))
          .filter((p) => p.currencies.length > 0),
      })),
    };

    return filtered;
  } catch (err) {
    console.error(
      "[pawapay] getActiveConfiguration failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch active configuration.",
      502,
      "PAWAPAY_CONFIG_FETCH_FAILED",
    );
  }
}

module.exports = {
  initiateDeposit,
  checkDepositStatus,
  initiatePayout,
  checkPayoutStatus,
  initiateRefund,
  checkRefundStatus,
  getWalletBalances,
  getActiveConfiguration,
  resolveDecimalsInAmount,
};
