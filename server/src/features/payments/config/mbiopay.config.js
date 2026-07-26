const axios = require("axios");
const { env } = require("../../../config/env");

const BASE_URL = "https://dashboard.mbiyo.africa/api/v1";

function getActiveEnvironment() {
  return env.mbiyopay.environment === "production" ? "production" : "sandbox";
}

function getActiveApiKey() {
  return getActiveEnvironment() === "production"
    ? env.mbiyopay.productionApiKey
    : env.mbiyopay.sandboxApiKey;
}

function buildCallbackUrl() {
  const base = env.mbiyopay.callbackBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/mbiyopay/callbacks`;
}

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${getActiveApiKey()}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

async function checkMbiyoPayConnection(timeoutMs = 3000) {
  const startedAt = Date.now();

  const ping = client.get("/countries", { params: { page: 1, limit: 1 } });
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`MbiyoPay check timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    await Promise.race([ping, timeout]);
    return {
      connected: true,
      environment: getActiveEnvironment(),
      latencyMs: Date.now() - startedAt,
      error: null,
    };
  } catch (error) {
    console.error("[mbiyopay] Connection check failed:", err.message);
    return {
      connected: false,
      environment: getActiveEnvironment(),
      latencyMs: null,
      error: err.message,
    };
  }
}

module.exports = {
  client,
  getActiveEnvironment,
  getActiveApiKey,
  buildCallbackUrl,
  checkMbiyoPayConnection,
};
