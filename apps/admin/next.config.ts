import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

function resolveApiProxyTarget(): string | null {
  // Only the server-side upstream URL may be used as a rewrite target —
  // never NEXT_PUBLIC_API_BASE_URL when it is the relative "/api/v1" path.
  const raw = process.env.API_PROXY_TARGET || process.env.API_BASE_URL;
  if (!raw || raw.startsWith("/")) return null;

  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed.slice(0, -"/api/v1".length);
  }
  return trimmed;
}

const apiProxyTarget = resolveApiProxyTarget();
const usesApiProxy =
  process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/") === true;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    if (!usesApiProxy || !apiProxyTarget) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "swift-goma",
  project: "admin-swiftgoma",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
