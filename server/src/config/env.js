require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  clientOrigins: (process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  sentryDsn: process.env.SENTRY_DSN || "",
  redisUrl: process.env.REDIS_URL,
  databaseUrl: process.env.DATABASE_URL || "",
};

const isProduction = env.nodeEnv === "production";

module.exports = {
  env,
  isProduction,
};
