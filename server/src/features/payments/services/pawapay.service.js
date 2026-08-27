const { client, getBaseUrl } = require("../config/pawapay.config");
const {
  generateTransactionId,
  isValidAmount,
  formatAmount,
  isValidMsisdn,
  toMsisdn,
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
      `Aucune configuration active trouvée pour ${provider} / ${currency} / ${operationType} en ${country}.`,
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

  depositId: requestedDepositId,
}) {
  if (!isValidAmount(amount))
    throw new ValidationError("Montant de dépôt invalide.");
  if (!isValidMsisdn(payerPhoneNumber))
    throw new ValidationError("Numéro de téléphone du payeur invalide.");
  if (!isValidStatementDescription(customerMessage)) {
    throw new ValidationError(
      "Le message client doit contenir entre 4 et 22 caractères alphanumériques.",
    );
  }
  if (!provider)
    throw new ValidationError("Fournisseur mobile money manquant.");

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
      accountDetails: { phoneNumber: toMsisdn(payerPhoneNumber), provider },
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
      "Impossible d'initier le dépôt.",
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
      "Impossible de vérifier le statut du dépôt.",
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

  payoutId: requestedPayoutId,
}) {
  if (!isValidAmount(amount))
    throw new ValidationError("Montant de paiement sortant invalide.");
  if (!isValidMsisdn(recipientPhoneNumber))
    throw new ValidationError("Numéro de téléphone du destinataire invalide.");
  if (!isValidStatementDescription(customerMessage)) {
    throw new ValidationError(
      "Le message client doit contenir entre 4 et 22 caractères alphanumériques.",
    );
  }
  if (!provider)
    throw new ValidationError("Fournisseur mobile money manquant.");

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
      accountDetails: {
        phoneNumber: toMsisdn(recipientPhoneNumber),
        provider,
      },
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
      "Impossible d'initier le paiement sortant.",
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
      "Impossible de vérifier le statut du paiement sortant.",
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

  refundId: requestedRefundId,
}) {
  if (!depositId)
    throw new ValidationError(
      "Identifiant de dépôt manquant pour le remboursement.",
    );
  if (amount !== undefined && !isValidAmount(amount))
    throw new ValidationError("Montant de remboursement invalide.");

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
      "Impossible d'initier le remboursement.",
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
      "Impossible de vérifier le statut du remboursement.",
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
      "Impossible de récupérer les soldes du portefeuille.",
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
      "Impossible de récupérer la configuration active.",
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
