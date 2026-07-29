require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  clientOrigins: (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  sentryDsn: process.env.SENTRY_DSN || "",
  redisUrl: process.env.REDIS_URL || "",
  databaseUrl: process.env.DATABASE_URL || "",
  directUrl: process.env.DIRECT_URL || "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.SMTP_FROM_NAME || "Swiftgoma",
    fromEmail: process.env.SMTP_FROM_EMAIL || "",
  },

  africastalking: {
    apiKey: process.env.AFRICASTALKING_API_KEY || "",
    username: process.env.AFRICASTALKING_USERNAME || "sandbox",
    senderId: process.env.AFRICASTALKING_SENDER_ID || "",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "",
    accessExpiresInMinutes:
      Number(process.env.JWT_ACCESS_EXPIRES_IN_MINUTES) || 15,
    refreshExpiresInDays: Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS) || 30,
  },

  cookie: {
    domain: process.env.COOKIE_DOMAIN || "",
    sameSite: process.env.COOKIE_SAMESITE || "lax",
  },

  appUrl: process.env.APP_URL || "http://localhost:3000",
  totpSecretEncryptionKey: process.env.TOTP_SECRET_ENCRYPTION_KEY || "",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  },

  webauthn: {
    rpId: process.env.WEBAUTHN_RP_ID || "localhost",
    rpName: process.env.WEBAUTHN_RP_NAME || "SwiftGoma",
  },

  oneSignal: {
    baseUrl: process.env.BASE_URL,
    restApiKey: process.env.API_KEY,
    appId: process.env.APP_ID,
  },

  pawapay: {
    environment: process.env.PAWAPAY_ENVIRONMENT || "sandbox",
    callbackBaseUrl: process.env.PAWAPAY_CALLBACK_BASE_URL || "",

    sandbox: {
      apiToken: process.env.PAWAPAY_SANDBOX_API_TOKEN || "",
      privateKeyPem: process.env.PAWAPAY_SANDBOX_PRIVATE_KEY_PEM || "",
      keyId: process.env.PAWAPAY_SANDBOX_KEY_ID || "",
      publicKeyPem: process.env.PAWAPAY_SANDBOX_PUBLIC_KEY_PEM || "",
    },

    production: {
      apiToken: process.env.PAWAPAY_PRODUCTION_API_TOKEN || "",
      privateKeyPem: process.env.PAWAPAY_PRODUCTION_PRIVATE_KEY_PEM || "",
      keyId: process.env.PAWAPAY_PRODUCTION_KEY_ID || "",
      publicKeyPem: process.env.PAWAPAY_PRODUCTION_PUBLIC_KEY_PEM || "",
    },

    signingEnabled: process.env.PAWAPAY_SIGNING_ENABLED === "true",
  },

  mbiyopay: {
    environment: process.env.MBIYOPAY_ENVIRONMENT || "sandbox",
    sandboxApiKey: process.env.MBIYOPAY_SANDBOX_API_KEY || "",
    productionApiKey: process.env.MBIYOPAY_PRODUCTION_API_KEY || "",
    webhookSecret: process.env.MBIYOPAY_WEBHOOK_SECRET || "",
    callbackBaseUrl: process.env.MBIYOPAY_CALLBACK_BASE_URL || "",
  },
};

const isProduction = env.nodeEnv === "production";

function assertRequiredEnv() {
  if (!isProduction) return;

  const missing = [];

  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (!env.clientOrigins.length) missing.push("CLIENT_ORIGINS");
  if (!env.jwt.accessSecret) missing.push("JWT_ACCESS_SECRET");
  if (!env.jwt.refreshSecret) missing.push("JWT_REFRESH_SECRET");
  if (!env.mbiyopay.webhookSecret) missing.push("MBIYOPAY_WEBHOOK_SECRET");
  if (!env.cloudinary.cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!env.cloudinary.apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!env.cloudinary.apiSecret) missing.push("CLOUDINARY_API_SECRET");
  if (!env.totpSecretEncryptionKey) missing.push("TOTP_SECRET_ENCRYPTION_KEY");

  if (env.pawapay.environment === "production") {
    if (!env.pawapay.production.apiToken)
      missing.push("PAWAPAY_PRODUCTION_API_TOKEN");
    if (!env.pawapay.production.privateKeyPem)
      missing.push("PAWAPAY_PRODUCTION_PRIVATE_KEY_PEM");
    if (!env.pawapay.production.keyId)
      missing.push("PAWAPAY_PRODUCTION_KEY_ID");
    if (!env.pawapay.production.publicKeyPem)
      missing.push("PAWAPAY_PRODUCTION_PUBLIC_KEY_PEM");
  }
  if (
    env.mbiyopay.environment === "production" &&
    !env.mbiyopay.productionApiKey
  ) {
    missing.push("MBIYOPAY_PRODUCTION_API_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Variable(s) d'environnement requise(s) manquante(s) en production : ${missing.join(", ")}. Démarrage refusé.`,
    );
  }
}

assertRequiredEnv();

module.exports = { env, isProduction };
