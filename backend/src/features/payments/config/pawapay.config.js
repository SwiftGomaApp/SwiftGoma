const axios = require("axios");
const {
  pawapay_production_api_token,
  pawapay_sandbox_api_token,
  pawapay_environement,
  pawapay_callback_base_url,
  pawapay_signed_requests,
  pawapay_signed_callbacks,
  pawapay_active_countries,
} = require("../../../config/env.config");

const environment =
  pawapay_environement === "production" ? "production" : "sandbox";
const isProduction = environment === "production";

const BASE_URLS = {
  production: "https://api.pawapay.io",
  sandbox: "https://api.sandbox.pawapay.io",
};

const AUTHORITIES = {
  production: "api.pawapay.io",
  sandbox: "api.sandbox.pawapay.io",
};

const apiToken = isProduction
  ? pawapay_production_api_token
  : pawapay_sandbox_api_token;

if (!apiToken) {
  throw new Error(
    `❌ Missing pawaPay API token for "${environment}" environment. Check your .env file.`,
  );
}

const activeCountries = (pawapay_active_countries || "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

const signedRequests = pawapay_signed_requests === "true";
const signedCallbacks = pawapay_signed_callbacks === "true";

const FINANCIAL_PATHS = ["/v2/deposits", "/v2/payouts", "/v2/refunds"];

const isFinancialPath = (url = "") =>
  FINANCIAL_PATHS.some((p) => url.startsWith(p));

const pawapayClient = axios.create({
  baseURL: BASE_URLS[environment],
  timeout: 15000,
  headers: {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  },
});

pawapayClient.interceptors.request.use(
  (config) => {
    if (
      signedRequests &&
      config.method === "post" &&
      isFinancialPath(config.url)
    ) {
      const { buildSignedHeaders } = require("./pawapay.signature");

      const signedHeaders = buildSignedHeaders({
        method: config.method,
        authority: AUTHORITIES[environment],
        path: config.url,
        body: config.data,
      });

      config.headers = { ...config.headers, ...signedHeaders };
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `➡️  [pawaPay:${environment}] ${config.method?.toUpperCase()} ${config.url}`,
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);

pawapayClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `💥 [pawaPay:${environment}] ${error.response.status} ${error.config?.url}:`,
        error.response.data,
      );
    } else {
      console.error(
        `💥 [pawaPay:${environment}] Request failed:`,
        error.message,
      );
    }
    return Promise.reject(error);
  },
);

module.exports = {
  pawapayClient,
  environment,
  isProduction,
  baseUrl: BASE_URLS[environment],
  authority: AUTHORITIES[environment],
  callbackBaseUrl: pawapay_callback_base_url,
  activeCountries,
  signedRequests,
  signedCallbacks,
};
