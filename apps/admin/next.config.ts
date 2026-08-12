import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

function resolveUpstreamOrigin(): string | null {
  const raw = process.env.API_PROXY_TARGET || process.env.API_BASE_URL;
  if (!raw || raw.startsWith("/")) return null;

  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed.slice(0, -"/api/v1".length);
  }
  return trimmed;
}

const upstreamOrigin = resolveUpstreamOrigin();

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
    if (!upstreamOrigin) return [];
    return [
      {
        source: "/socket.io/:path*",
        destination: `${upstreamOrigin}/socket.io/:path*`,
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
