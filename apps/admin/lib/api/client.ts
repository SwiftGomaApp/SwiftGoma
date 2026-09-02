import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/api/config/env";

export interface ApiErrorShape {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown;
    requestId: string;
  };
}

export class ApiError extends Error {
  code: string;
  requestId: string;
  details: unknown;
  status: number;

  constructor(shape: ApiErrorShape, status: number) {
    super(shape.error.message);
    this.name = "ApiError";
    this.code = shape.error.code;
    this.requestId = shape.error.requestId;
    this.details = shape.error.details;
    this.status = status;
  }
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let isRefreshing = false;
let refreshWaiters: Array<() => void> = [];

function queueUntilRefreshed(): Promise<void> {
  return new Promise((resolve) => refreshWaiters.push(resolve));
}

function flushRefreshWaiters() {
  refreshWaiters.forEach((resolve) => resolve());
  refreshWaiters = [];
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: env.api.baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const REFRESH_LOCK_NAME = "swg-admin-token-refresh";
const REFRESH_DEDUPE_WINDOW_MS = 5000;
const LAST_REFRESH_STORAGE_KEY = "swg-admin:last-token-refresh-at";

function getLastRefreshAt(): number {
  try {
    return Number(window.localStorage.getItem(LAST_REFRESH_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function setLastRefreshAt(time: number) {
  try {
    window.localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(time));
  } catch {
    // Private browsing / storage disabled — cross-tab dedupe just won't apply.
  }
}

async function performRefresh() {
  // Another tab may have refreshed moments ago — the rotated cookie is
  // already shared across tabs, so skip the redundant network round trip.
  if (Date.now() - getLastRefreshAt() < REFRESH_DEDUPE_WINDOW_MS) return;
  await apiClient.post("/auth/refresh-token");
  setLastRefreshAt(Date.now());
}

export async function refreshAuthSession() {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    await navigator.locks.request(REFRESH_LOCK_NAME, () => performRefresh());
  } else {
    await performRefresh();
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const original = error.config as RetriableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original.url?.includes("/auth/refresh-token") &&
      !original._retried
    ) {
      original._retried = true;

      if (isRefreshing) {
        await queueUntilRefreshed();
        return apiClient(original);
      }

      isRefreshing = true;
      try {
        await refreshAuthSession();
        isRefreshing = false;
        flushRefreshWaiters();
        return apiClient(original);
      } catch (refreshErr) {
        isRefreshing = false;
        flushRefreshWaiters();
        return Promise.reject(refreshErr);
      }
    }

    if (error.response?.status === 429) {
      return Promise.reject(
        new ApiError(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Trop de requêtes — merci de patienter un instant.",
              details: null,
              requestId: "",
            },
          },
          429,
        ),
      );
    }

    if (error.response?.data?.error) {
      return Promise.reject(
        new ApiError(error.response.data, error.response.status),
      );
    }

    return Promise.reject(error);
  },
);
