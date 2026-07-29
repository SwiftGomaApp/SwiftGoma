const { client, buildCallbackUrl } = require("../config/mbiopay.config");
const {
  generateOrderId,
  assertValidPayinInput,
  assertValidPayoutInput,
  normalizePhoneNumber,
} = require("../utils/mbiyopay.utils");
const { AppError } = require("../../../common/errors");

async function initiatePayin({
  amount,
  currency,
  network,
  phoneNumber,
  countryCode,
  orderId,
}) {
  assertValidPayinInput({
    amount,
    currency,
    network,
    phoneNumber,
    countryCode,
  });

  const finalOrderId = orderId || generateOrderId("SWG-IN");

  const payload = {
    amount,
    currency,
    payment_method: "mobile_money",
    order_id: finalOrderId,
    callback_url: buildCallbackUrl(),
    metadata: {
      network,
      phone_number: normalizePhoneNumber(phoneNumber),
      country_code: countryCode,
    },
  };

  let res;
  try {
    res = await client.post("/merchant/payin", payload);
  } catch (err) {
    const mbiyopayMessage = err.response?.data?.message;

    console.log(
      "[mbiyopay] RAW error response:",
      JSON.stringify(err.response?.data, null, 2),
    );

    throw new AppError(
      mbiyopayMessage || "Failed to initiate payin.",
      err.response?.status || 502,
      "MBIYOPAY_PAYIN_FAILED",
    );
  }

  const data = res.data.data;

  if (data.status === "failed") {
    console.error(
      "[mbiyopay] Payin returned status=failed:",
      JSON.stringify(data, null, 2),
    );
    throw new AppError(
      data.failure_reason ||
        "Le paiement a été refusé par l'opérateur mobile money.",
      400,
      "MBIYOPAY_PAYIN_FAILED",
    );
  }

  return { orderId: finalOrderId, ...data };
}

async function initiatePayout({
  amount,
  currency,
  network,
  phoneNumber,
  countryCode,
  beneficiary,
  orderId,
}) {
  assertValidPayoutInput({
    amount,
    currency,
    network,
    phoneNumber,
    countryCode,
    beneficiary,
  });

  const finalOrderId = orderId || generateOrderId("SWG-OUT");

  const payload = {
    amount,
    currency,
    payment_method: "mobile_money",
    order_id: finalOrderId,
    callback_url: buildCallbackUrl(),
    metadata: {
      network,
      phone_number: normalizePhoneNumber(phoneNumber),
      country_code: countryCode,
      beneficiary,
    },
  };

  try {
    const res = await client.post("/merchant/payout", payload);
    return { orderId: finalOrderId, ...res.data.data };
  } catch (err) {
    console.log(
      "[mbiyopay] RAW payout error response:",
      JSON.stringify(err.response?.data, null, 2),
    );

    const mbiyopayMessage = err.response?.data?.message;
    console.error(
      "[mbiyopay] initiatePayout failed:",
      err.response?.data || err.message,
    );

    if (err.response?.status === 403) {
      throw new AppError(
        mbiyopayMessage || "KYC approval required for live payouts.",
        403,
        "MBIYOPAY_KYC_REQUIRED",
      );
    }
    if (
      err.response?.status === 400 &&
      err.response?.data?.message?.includes("Insufficient")
    ) {
      throw new AppError(
        mbiyopayMessage || "Insufficient MbiyoPay balance for payout.",
        400,
        "MBIYOPAY_INSUFFICIENT_BALANCE",
      );
    }

    throw new AppError(
      mbiyopayMessage || "Failed to initiate payout.",
      err.response?.status || 502,
      "MBIYOPAY_PAYOUT_FAILED",
    );
  }
}

async function finalizePayment(transactionId, otp) {
  try {
    const res = await client.post(
      `/merchant/transactions/${transactionId}/finalize`,
      { otp },
    );
    return res.data;
  } catch (err) {
    console.error(
      "[mbiyopay] finalizePayment failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to finalize payment.",
      502,
      "MBIYOPAY_FINALIZE_FAILED",
    );
  }
}

async function checkTransactionStatus(transactionIdOrOrderId) {
  try {
    const res = await client.get(
      `/merchant/transactions/${transactionIdOrOrderId}`,
    );
    return res.data.data;
  } catch (err) {
    console.error(
      "[mbiyopay] checkTransactionStatus failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to check transaction status.",
      502,
      "MBIYOPAY_STATUS_CHECK_FAILED",
    );
  }
}

async function getWalletBalances(currency) {
  try {
    const res = await client.get("/balances", {
      params: currency ? { currency } : {},
    });
    return res.data.data;
  } catch (err) {
    console.error(
      "[mbiyopay] getWalletBalances failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch wallet balances.",
      502,
      "MBIYOPAY_BALANCE_FETCH_FAILED",
    );
  }
}

async function getNetworkBalances({ currency, countryCode } = {}) {
  try {
    const res = await client.get("/balance/networks", {
      params: {
        ...(currency ? { currency } : {}),
        ...(countryCode ? { country_code: countryCode } : {}),
      },
    });
    return res.data.data;
  } catch (err) {
    console.error(
      "[mbiyopay] getNetworkBalances failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch network balances.",
      502,
      "MBIYOPAY_NETWORK_BALANCE_FETCH_FAILED",
    );
  }
}

async function getCountries({ page = 1, limit = 20 } = {}) {
  try {
    const res = await client.get("/countries", { params: { page, limit } });
    return res.data;
  } catch (err) {
    console.error(
      "[mbiyopay] getCountries failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch countries.",
      502,
      "MBIYOPAY_COUNTRIES_FETCH_FAILED",
    );
  }
}

async function getAllCountries() {
  try {
    const res = await client.get("/countries", { params: { page: "all" } });
    return res.data.data;
  } catch (err) {
    console.error(
      "[mbiyopay] getAllCountries failed:",
      err.response?.data || err.message,
    );
    throw new AppError(
      "Failed to fetch all countries.",
      502,
      "MBIYOPAY_COUNTRIES_FETCH_FAILED",
    );
  }
}

module.exports = {
  initiatePayin,
  initiatePayout,
  finalizePayment,
  checkTransactionStatus,
  getWalletBalances,
  getNetworkBalances,
  getCountries,
  getAllCountries,
};
