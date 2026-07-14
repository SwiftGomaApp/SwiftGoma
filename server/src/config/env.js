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
};

const isProduction = env.nodeEnv === "production";

module.exports = { env, isProduction };
