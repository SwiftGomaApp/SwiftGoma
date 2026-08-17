import type { NextRequest } from "next/server";

export function resolveClientIp(req: NextRequest): string | null {
  if (process.env.VERCEL) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const parts = forwarded
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      return parts[parts.length - 1] || null;
    }
    return null;
  }

  if (process.env.TRUST_PROXY_HEADERS === "1") {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || null;
    }
    return (
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      null
    );
  }

  return null;
}
