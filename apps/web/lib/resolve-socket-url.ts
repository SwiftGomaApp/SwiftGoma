const LOCAL_SOCKET_URL = "http://localhost:4000";

export function resolveSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (configured && configured !== "same-origin") {
    return configured;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return LOCAL_SOCKET_URL;
}
