const NEXT_PARAM = "next";
const DEFAULT_PATH = "/account";

export function sanitizeNextPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  if (path.startsWith("/auth")) return null;
  return path;
}

export function buildSignInHref(nextPath?: string | null): string {
  const safe = sanitizeNextPath(nextPath);
  return safe
    ? `/auth/sign-in?${NEXT_PARAM}=${encodeURIComponent(safe)}`
    : "/auth/sign-in";
}

export function getNextParam(searchParams: {
  get(name: string): string | null;
}): string {
  return sanitizeNextPath(searchParams.get(NEXT_PARAM)) ?? DEFAULT_PATH;
}
