function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        `Check .env.local (dev) or your deployment platform's env settings (prod).`,
    );
  }
  return value;
}

function resolvePublicApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;
  if (configured?.startsWith("/")) {
    return configured.replace(/\/$/, "") || "/api/v1";
  }
  return configured ?? "http://localhost:4000/api/v1";
}

function resolveServerApiUrl(publicApiUrl: string): string {
  if (publicApiUrl.startsWith("/")) {
    // Browser code only needs the relative proxy path (env.api.baseUrl).
    if (typeof window !== "undefined") {
      return publicApiUrl;
    }

    const siteUrl = required(
      process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
      "NEXT_PUBLIC_SITE_URL",
    );
    return `${siteUrl.replace(/\/$/, "")}${publicApiUrl}`;
  }

  return process.env.API_BASE_URL || publicApiUrl;
}

const publicApiUrl = resolvePublicApiUrl();
const usesApiProxy = publicApiUrl.startsWith("/");

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  api: {
    baseUrl: publicApiUrl,
    usesProxy: usesApiProxy,
  },

  server: {
    apiBaseUrl: resolveServerApiUrl(publicApiUrl),
  },

  site: {
    url:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3001"),
  },
} as const;

export const isProduction = env.nodeEnv === "production";

function assertRequiredEnv() {
  // Server-only vars (API_BASE_URL) are not in the browser bundle.
  if (typeof window !== "undefined") return;
  if (!isProduction) return;

  const missing: string[] = [];

  if (!env.api.baseUrl) missing.push("NEXT_PUBLIC_API_URL");
  if (!env.server.apiBaseUrl) {
    missing.push("API_BASE_URL or NEXT_PUBLIC_SITE_URL");
  }

  if (usesApiProxy && !process.env.API_BASE_URL && !process.env.API_PROXY_TARGET) {
    missing.push("API_BASE_URL (upstream target for /api/v1 proxy route)");
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing required environment variable(s) in production: ${missing.join(", ")}. Refusing to start.`,
    );
  }
}

assertRequiredEnv();
