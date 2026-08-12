import { NextRequest, NextResponse } from "next/server";
import { getApiUpstreamOrigin } from "@/lib/api/proxy/upstream";
import { resolveClientIp } from "@/lib/api/proxy/client-ip";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
]);

function sanitizeSetCookie(value: string): string {
  return value
    .split(";")
    .filter((part) => !part.trim().toLowerCase().startsWith("domain="))
    .join(";");
}

export async function handleApiProxy(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const origin = getApiUpstreamOrigin();
  if (!origin) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROXY_NOT_CONFIGURED",
          message:
            "API proxy is not configured. Set API_BASE_URL to your upstream API (e.g. ngrok URL + /api/v1).",
        },
      },
      { status: 503 },
    );
  }

  const path = pathSegments.join("/");
  const url = `${origin}/api/v1/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower)) return;
    if (lower === "accept-encoding") return;
    headers.set(key, value);
  });
  headers.set("ngrok-skip-browser-warning", "1");
  headers.set("accept-encoding", "identity");

  const clientIp = resolveClientIp(req);
  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
    headers.set("x-real-ip", clientIp);
  }

  const hasBody = !["GET", "HEAD"].includes(req.method);
  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (HOP_BY_HOP.has(lower)) return;
    if (STRIP_RESPONSE_HEADERS.has(lower)) return;
    responseHeaders.set(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    responseHeaders.append("set-cookie", sanitizeSetCookie(cookie));
  }
  responseHeaders.set("cache-control", "no-store");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
