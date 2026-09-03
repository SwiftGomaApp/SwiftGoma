import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mapbox GL (WebGL/canvas + web workers) isn't safe under Strict Mode's
  // dev-only double-invoke of effects — it creates, tears down, and
  // recreates the map synchronously, which breaks its internal render
  // pipeline. Dev-only; has no effect on production behavior.
  reactStrictMode: false,
};

export default nextConfig;
