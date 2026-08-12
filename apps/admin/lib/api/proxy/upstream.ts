export function getApiUpstreamOrigin(): string | null {
  const raw = process.env.API_PROXY_TARGET || process.env.API_BASE_URL;
  if (!raw || raw.startsWith("/")) return null;

  const trimmed = raw.replace(/\/$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return trimmed.slice(0, -"/api/v1".length);
  }
  return trimmed;
}

export function usesApiProxy(): boolean {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith("/") === true;
}
