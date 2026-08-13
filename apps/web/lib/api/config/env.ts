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

    // Server-side: call the upstream API directly when configured, avoiding
    // an extra same-origin round-trip through the Next.js proxy on Vercel.
    const directUrl = process.env.API_BASE_URL?.replace(/\/$/, "");
    if (directUrl) {
      return directUrl;
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
