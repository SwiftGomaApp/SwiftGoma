function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Check .env.local (dev) or your deployment platform's env settings (prod).`,
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  api: {
    baseUrl: required(
      process.env.NEXT_PUBLIC_API_BASE_URL,
      "NEXT_PUBLIC_API_BASE_URL",
    ),
  },

  server: {
    apiBaseUrl:
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
  },

  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },

  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
} as const;

export const isProduction = env.nodeEnv === "production";

function assertRequiredEnv() {
  if (!isProduction) return;

  const missing: string[] = [];

  if (!env.api.baseUrl) missing.push("NEXT_PUBLIC_API_BASE_URL");
  if (!env.server.apiBaseUrl) missing.push("API_BASE_URL");

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variable(s) in production: ${missing.join(", ")}. Refusing to start.`,
    );
  }
}

assertRequiredEnv();
