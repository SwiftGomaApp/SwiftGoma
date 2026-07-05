"use strict";

const axios = require("axios");
const { randomUUID } = require("crypto");
const config = require("../../../config/pawapay.config");
const { errors } = require("../../../shared/errors/app.error");

const http = axios.create({
  baseURL: config.baseURL,
  timeout: config.requestTimeoutMs,
  headers: {
    Authorization: `Bearer ${config.apiToken}`,
    "Content-Type": "application/json",
  },
});

const DEFAULT_CUSTOMER_MESSAGE = "SwiftGoma";

async function request(method, url, data) {
  try {
    const res = await http.request({ method, url, data });
    console.log(
      `[pawapay] ${method.toUpperCase()} ${url} →`,
      res.status,
      JSON.stringify(res.data),
    );
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    if (err.response) {
      console.error(
        `[pawapay] ${method.toUpperCase()} ${url} failed →`,
        err.response.status,
        JSON.stringify(err.response.data),
      );
      return {
        ok: false,
        status: err.response.status,
        data: err.response.data,
      };
    }
    console.error(
      `[pawapay] ${method.toUpperCase()} ${url} network error →`,
      err.message,
    );
    return {
      ok: false,
      status: null,
      data: { error: err.message, network: true },
    };
  }
}

function newId() {
  return randomUUID();
}

function resolveCustomerMessage(customerMessage) {
  const message = customerMessage?.trim() || DEFAULT_CUSTOMER_MESSAGE;

  if (message.length < 4 || message.length > 22) {
    throw errors.badRequest("customerMessage must be 4–22 characters.");
  }

  return message;
}

// =============================== DEPOSITS ==============================

async function initiateDeposit({
  amount,
  currency,
  phoneNumber,
  provider,
  depositId = newId(),
  clientReferenceId,
  customerMessage,
  metadata,
}) {
  const payload = {
    depositId,
    amount: String(amount),
    currency,
    customerMessage: resolveCustomerMessage(customerMessage),
    payer: {
      type: "MMO",
      accountDetails: { phoneNumber, provider },
    },
    ...(clientReferenceId && { clientReferenceId }),
    ...(metadata && { metadata }),
  };

  const result = await request("post", "/v2/deposits", payload);
  return { depositId, ...result };
}

async function checkDepositStatus(depositId) {
  return request("get", `/v2/deposits/${depositId}`);
}

async function resendDepositCallback(depositId) {
  return request("get", `/v2/deposits/resend-callback/${depositId}`);
}

// =============================== PAYOUTS ==============================

async function initiatePayout({
  amount,
  currency,
  phoneNumber,
  provider,
  payoutId = newId(),
  clientReferenceId,
  customerMessage,
  metadata,
}) {
  const payload = {
    payoutId,
    amount: String(amount),
    currency,
    customerMessage: resolveCustomerMessage(customerMessage),
    recipient: {
      type: "MMO",
      accountDetails: { phoneNumber, provider },
    },
    ...(clientReferenceId && { clientReferenceId }),
    ...(metadata && { metadata }),
  };

  const result = await request("post", "/v2/payouts", payload);
  return { payoutId, ...result };
}

async function initiateBulkPayouts(payouts = []) {
  const items = payouts.map((p) => ({
    payoutId: p.payoutId || newId(),
    amount: String(p.amount),
    currency: p.currency,
    customerMessage: resolveCustomerMessage(p.customerMessage),
    recipient: {
      type: "MMO",
      accountDetails: { phoneNumber: p.phoneNumber, provider: p.provider },
    },
    ...(p.clientReferenceId && { clientReferenceId: p.clientReferenceId }),
    ...(p.metadata && { metadata: p.metadata }),
  }));

  // Send the raw array, not wrapped in { payouts: [...] }
  const result = await request("post", "/v2/payouts/bulk", items);
  return { payoutIds: items.map((i) => i.payoutId), ...result };
}

async function checkPayoutStatus(payoutId) {
  return request("get", `/v2/payouts/${payoutId}`);
}

async function resendPayoutCallback(payoutId) {
  return request("get", `/v2/payouts/resend-callback/${payoutId}`);
}

async function cancelEnqueuedPayout(payoutId) {
  return request("get", `/v2/payouts/fail-enqueued/${payoutId}`);
}

// =============================== REFUNDS ==============================

async function initiateRefund({
  depositId,
  amount,
  currency,
  refundId = newId(),
  metadata,
}) {
  const payload = {
    refundId,
    depositId,
    currency,
    ...(amount && { amount: String(amount) }),
    ...(metadata && { metadata }),
  };

  const result = await request("post", "/v2/refunds", payload);
  return { refundId, ...result };
}

async function checkRefundStatus(refundId) {
  return request("get", `/v2/refunds/${refundId}`);
}

async function resendRefundCallback(refundId) {
  return request("get", `/v2/refunds/resend-callback/${refundId}`);
}

// =============================== PAWAPAY WALLETS ==============================

async function walletBalances(country) {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  return request("get", `/v2/wallet-balances${query}`);
}

// =============================== TOOLKIT: account config, provider availability, phone prediction ==============================

async function activeConfig({ country, operationType } = {}) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (operationType) params.set("operationType", operationType);
  const qs = params.toString();
  return request("get", `/v2/active-conf${qs ? `?${qs}` : ""}`);
}

async function providerAvailability({ country, operationType } = {}) {
  const params = new URLSearchParams();
  if (country) params.set("country", country);
  if (operationType) params.set("operationType", operationType);
  const qs = params.toString();
  return request("get", `/v2/availability${qs ? `?${qs}` : ""}`);
}

async function predictProvider(phoneNumber) {
  return request("post", "/v2/predict-provider", { phoneNumber });
}

module.exports = {
  // deposits
  initiateDeposit,
  checkDepositStatus,
  resendDepositCallback,
  // payouts
  initiatePayout,
  initiateBulkPayouts,
  checkPayoutStatus,
  resendPayoutCallback,
  cancelEnqueuedPayout,
  // refunds
  initiateRefund,
  checkRefundStatus,
  resendRefundCallback,
  // wallet
  walletBalances,
  // toolkit
  activeConfig,
  providerAvailability,
  predictProvider,
};
