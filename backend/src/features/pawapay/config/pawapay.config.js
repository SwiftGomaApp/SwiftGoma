const crypto = require("crypto");

const ENV = (process.env.PAWAPAY_ENV || "sandbox").toLowerCase();
const IS_PRODUCTION = ENV === "production";

if (ENV !== "sandbox" && ENV !== "production") {
  throw new Error(
    `PAWAPAY_ENV must be "sandbox" or "production", got "${process.env.PAWAPAY_ENV}"`,
  );
}

const BASE_URLS = {
  sandbox: "https://api.sandbox.pawapay.io",
  production: "https://api.pawapay.io",
};

const COUNTRY_CODE_MAP = {
  cd: "COD",
  cod: "COD",
  drc: "COD",
  rw: "RWA",
  rwa: "RWA",
};

const parseActiveCountries = (raw) => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .map((c) => {
      const mapped = COUNTRY_CODE_MAP[c];
      if (!mapped) {
        throw new Error(
          `PAWAPAY_ACTIVE_COUNTRIES contains unrecognized country code "${c}". ` +
            `Known aliases: ${Object.keys(COUNTRY_CODE_MAP).join(", ")}`,
        );
      }
      return mapped;
    });
};

const signedRequests = process.env.PAWAPAY_SIGNED_REQUESTS === "true";
const signedCallbacks = process.env.PAWAPAY_SIGNED_CALLBACKS === "true";

const apiToken = IS_PRODUCTION
  ? process.env.PAWAPAY_PRODUCTION_API_TOKEN
  : process.env.PAWAPAY_SANDBOX_API_TOKEN;

const keyId = IS_PRODUCTION
  ? process.env.PAWAPAY_KEY_ID
  : process.env.PAWAPAY_KEY_ID_SANDBOX;

const privateKeyPemBase64 = IS_PRODUCTION
  ? process.env.PAWAPAY_PRIVATE_KEY_PEM_BASE64
  : process.env.PAWAPAY_PRIVATE_KEY_PEM_BASE64_SANDBOX;

let privateKey = null;
if (signedRequests) {
  if (!privateKeyPemBase64) {
    throw new Error(
      `PAWAPAY_SIGNED_REQUESTS is true but ` +
        `${IS_PRODUCTION ? "PAWAPAY_PRIVATE_KEY_PEM_BASE64" : "PAWAPAY_PRIVATE_KEY_PEM_BASE64_SANDBOX"} is not set.`,
    );
  }

  let pem;
  try {
    pem = Buffer.from(privateKeyPemBase64, "base64").toString("utf8");
  } catch (err) {
    throw new Error(
      `Failed to base64-decode PawaPay private key: ${err.message}`,
    );
  }

  try {
    privateKey = crypto.createPrivateKey(pem);
  } catch (err) {
    throw new Error(
      `Failed to parse PawaPay privatye ke as PEM after base64 decode: ${err.message}. ` +
        `Check that the value was base64-encoded from the raw PEM file, not the PEM text itself.`,
    );
  }
}

const pawapayConfig = {
  env: ENV,
  isProduction: IS_PRODUCTION,
  baseUrl: BASE_URLS[ENV],

  apiToken,
  keyId,
  privateKey,

  signedCallbacks,
  signedRequests,

  signAlgorithm: process.env.PAWAPAY_SIGN_ALGORITHM || "ecdsa-p256-sha256",
  signatureValiditySeconds: parseInt(
    process.env.PAWAPAY_SIGNATURE_VALIDITY_SECONDS || "60",
    10,
  ),

  callbackBaseUrl: process.env.PAWAPAY_CALLBACK_BASE_URL || null,
  activeCountries: parseActiveCountries(process.env.PAWAPAY_ACTIVE_COUNTRIES),
};

const validatePawaPayConfig = () => {
  const errors = [];

  if (!pawapayConfig.apiToken) {
    errors.push(
      `Missing ${IS_PRODUCTION ? "PAWAPAY_PRODUCTION_API_TOKEN" : "PAWAPAY_SANDBOX_API_TOKEN"}.`,
    );
  }

  if (pawapayConfig.signedRequests && !pawapayConfig.keyId) {
    errors.push(
      `PAWAPAY_SIGNED_REQUESTS is true but ${IS_PRODUCTION ? "PAWAPAY_KEY_ID" : "PAWAPAY_KEY_ID_SANDBOX"} is not set.`,
    );
  }

  if (pawapayConfig.activeCountries.length === 0) {
    errors.push(
      "PAWAPAY_ACTIVE_COUNTRIES resolved to an empty list — check the env value.",
    );
  }

  if (!pawapayConfig.callbackBaseUrl) {
    errors.push(
      "PAWAPAY_CALLBACK_BASE_URL is not set — callbacks have nowhere to register against.",
    );
  } else if (pawapayConfig.callbackBaseUrl.includes("ngrok") && IS_PRODUCTION) {
    errors.push(
      "PAWAPAY_CALLBACK_BASE_URL points at an ngrok URL while PAWAPAY_ENV=production. This is almost certainly wrong.",
    );
  } else if (pawapayConfig.callbackBaseUrl.includes("ngrok-free")) {
    console.warn(
      "PAWAPAY_CALLBACK_BASE_URL is a free ngrok URL — this subdomain rotates on every ngrok restart. " +
        "You'll need to re-register the callback URL in the PawaPay Dashboard each time it changes, " +
        "or upgrade to a static ngrok domain for stable local dev.",
    );
  }

  if (errors.length > 0) {
    throw new Error(
      `PawaPay configuration is invalid:\n  - ${errors.join("\n  - ")}`,
    );
  }

  console.log(
    `✅ PawaPay config validated — env=${pawapayConfig.env}, ` +
      `signedRequests=${pawapayConfig.signedRequests}, ` +
      `signedCallbacks=${pawapayConfig.signedCallbacks}, ` +
      `countries=${pawapayConfig.activeCountries.join(",")}`,
  );
};

module.exports = { pawapayConfig, validatePawaPayConfig };