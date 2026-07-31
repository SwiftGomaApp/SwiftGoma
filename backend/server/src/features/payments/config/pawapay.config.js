const axios = require("axios");
const { env } = require("../../../config/env");

const BASE_URLS = {
  sandbox: "https://api.sandbox.pawapay.io",
  production: "https://api.pawapay.io",
};

function getActiveEnvironment() {
  return env.pawapay.environment === "production" ? "production" : "sandbox";
}

function getActiveCredentials() {
  const activeEnv = getActiveEnvironment();
  return env.pawapay[activeEnv];
}

function decodePem(base64Value) {
  if (!base64Value) return "";
  try {
    return Buffer.from(base64Value, "base64").toString("utf-8");
  } catch (err) {
    console.error("[pawapay] Failed to decode PEM key:", err.message);
    return "";
  }
}

function getPrivateKeyPem() {
  return decodePem(getActiveCredentials().privateKeyPem);
}

function getPublicKeyPem() {
  return decodePem(getActiveCredentials().publicKeyPem);
}

function getKeyId() {
  return getActiveCredentials().keyId;
}

function buildCallbackUrl(type) {
  const base = env.pawapay.callbackBaseUrl.replace(/\/+$/, "");
  return `${base}/api/v1/pawapay/callbacks/${type}`;
}

function getBaseUrl() {
  return BASE_URLS[getActiveEnvironment()];
}

const client = axios.create({
  baseURL: BASE_URLS[getActiveEnvironment()],
  headers: {
    Authorization: `Bearer ${getActiveCredentials().apiToken}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

async function checkPawaPayConnection(timeoutMs = 3000) {
  const startedAt = Date.now();

  const ping = client.get("/v2/wallet-balances");
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`PawaPay check timed out after ${timeoutMs}ms`)),
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
  } catch (err) {
    console.error("[pawapay] Connection check failed:", err.message);
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
  getActiveCredentials,
  getPrivateKeyPem,
  getPublicKeyPem,
  getKeyId,
  buildCallbackUrl,
  checkPawaPayConnection,
  getBaseUrl,
};
