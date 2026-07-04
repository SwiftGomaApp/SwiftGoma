"use strict";

const {
  pawapay_environement,
  pawapay_production_api_token,
  pawapay_sandbox_api_token,
  pawapay_callback_base_url,
  pawapay_signed_requests,
  pawapay_signed_callbacks,
  pawapay_active_countries,
} = require("./env.config");

const ENV = (pawapay_environement || "sandbox").toLowerCase();

const BASE_URLS = {
  sandbox: "https://api.sandbox.pawapay.io",
  production: "https://api.pawapay.io",
};

const API_TOKEN =
  ENV === "production"
    ? pawapay_production_api_token
    : pawapay_sandbox_api_token;

if (!API_TOKEN) {
  console.warn(
    `[pawapay] Warning: no API token found for env "${ENV}". ` +
      `Set PAWAPAY_${ENV.toUpperCase()}_API_TOKEN in your .env`,
  );
}

const config = {
  env: ENV,
  baseURL: BASE_URLS[ENV],
  apiToken: API_TOKEN,
  apiVersion: "v2",

  callbackBaseUrl: pawapay_callback_base_url,
  callbacks: {
    deposit: `${pawapay_callback_base_url}/deposit`,
    payout: `${pawapay_callback_base_url}/payout`,
    refund: `${pawapay_callback_base_url}/refund`,
  },

  signedRequests: pawapay_signed_requests === "true",
  signedCallbacks: pawapay_signed_callbacks === "true",

  activeCountries: (pawapay_active_countries || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean),

  requestTimeoutMs: 20_000,
};

module.exports = config;
