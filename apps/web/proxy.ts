import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/api/config/env";

const ACCESS_TOKEN_COOKIE = "swg_access_token";
const PROTECTED_PREFIXES = ["/account", "/checkout", "/orders"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const hasAccessToken = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE));

  if (!isProtectedPath(pathname) || !hasAccessToken) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";

  const meRes = await fetch(`${env.server.apiBaseUrl}/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  }).catch(() => null);

  if (meRes?.ok) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const refreshRes = await fetch(
    `${env.server.apiBaseUrl}/auth/refresh-token`,
    {
      method: "POST",
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    },
  ).catch(() => null);

  if (!refreshRes?.ok) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const setCookies =
    typeof refreshRes.headers.getSetCookie === "function"
      ? refreshRes.headers.getSetCookie()
      : [];

  if (setCookies.length === 0) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const cookieMap = new Map(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        return [part.slice(0, idx), part.slice(idx + 1)] as const;
      }),
  );

  for (const setCookie of setCookies) {
    const [pair] = setCookie.split(";");
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    cookieMap.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }

  const newCookieHeader = Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

  requestHeaders.set("cookie", newCookieHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const setCookie of setCookies) {
    response.headers.append("set-cookie", setCookie);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
