function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Check .env.local (dev) or your deployment platform's env settings (prod).`,
    );
  }
  return value;
}

function resolvePublicApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured?.startsWith("/")) {
    return configured.replace(/\/$/, "") || "/api/v1";
  }
  return required(configured, "NEXT_PUBLIC_API_BASE_URL");
}

function resolveServerApiBaseUrl(publicApiBaseUrl: string): string {
  if (publicApiBaseUrl.startsWith("/")) {
    // Browser code only needs the relative proxy path (env.api.baseUrl).
    if (typeof window !== "undefined") {
      return publicApiBaseUrl;
    }

    // Server-side: call the upstream API directly when configured, avoiding
    // an extra same-origin round-trip through the Next.js proxy on Vercel.
    const directUrl = process.env.API_BASE_URL?.replace(/\/$/, "");
    if (directUrl) {
      return directUrl;
    }

    const appUrl = required(
      process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_ADMIN_URL ||
        (process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : undefined),
      "NEXT_PUBLIC_APP_URL",
    );
    return `${appUrl.replace(/\/$/, "")}${publicApiBaseUrl}`;
  }

  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
}

const publicApiBaseUrl = resolvePublicApiBaseUrl();
const usesApiProxy = publicApiBaseUrl.startsWith("/");

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  api: {
    baseUrl: publicApiBaseUrl,
    usesProxy: usesApiProxy,
  },

  server: {
    apiBaseUrl: resolveServerApiBaseUrl(publicApiBaseUrl),
  },

  app: {
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_ADMIN_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  },

  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
} as const;

export const isProduction = env.nodeEnv === "production";
