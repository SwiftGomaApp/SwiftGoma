import { ApiException } from "./api-exception";

export type ApiStatus = "offline" | "rate-limited" | "error" | null;

export function classifyApiError(err: unknown): ApiStatus {
  if (err instanceof ApiException) {
    if (err.isNetworkError) return "offline";
    if (err.isRateLimited) return "rate-limited";
    return "error";
  }
  return "error";
}
