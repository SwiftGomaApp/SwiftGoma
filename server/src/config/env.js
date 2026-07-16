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
};

const isProduction = env.nodeEnv === "production";

module.exports = { env, isProduction };
