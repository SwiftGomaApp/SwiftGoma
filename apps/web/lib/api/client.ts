"use client";

import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "@/lib/api/config/env";

export const apiClient = axios.create({
  baseURL: env.client.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

type QueuedRequest = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
};

let isRefreshing = false;
let queue: QueuedRequest[] = [];

function flushQueue(error: unknown) {
  queue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(config));
    }
  });
  queue = [];
}

const REFRESH_LOCK_NAME = "swg-token-refresh";
const REFRESH_DEDUPE_WINDOW_MS = 5000;
const LAST_REFRESH_STORAGE_KEY = "swg:last-token-refresh-at";

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

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const status = error.response?.status;
    const url = originalRequest?.url ?? "";
    const isAuthEndpoint = url.includes("/auth/");

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, config: originalRequest });
      });
    }

    isRefreshing = true;

    try {
      await refreshAuthSession();
      flushQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("swg:session-expired"));
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function isApiError(error: unknown): error is AxiosError<ApiErrorBody> {
  return axios.isAxiosError(error);
}

export function isNetworkError(error: unknown): boolean {
  return isApiError(error) && !error.response;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.get<ApiEnvelope<T>>(url, config);
  return data.data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) {
  const { data } = await apiClient.post<ApiEnvelope<T>>(url, body, config);
  return data.data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) {
  const { data } = await apiClient.patch<ApiEnvelope<T>>(url, body, config);
  return data.data;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
) {
  const { data } = await apiClient.put<ApiEnvelope<T>>(url, body, config);
  return data.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const { data } = await apiClient.delete<ApiEnvelope<T>>(url, config);
  return data.data;
}
