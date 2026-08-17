import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { ApiException } from "./api-exception";
import { env } from "./config/env";
import { authApi } from "./routes/auth";

function resolveApiBaseUrl(): string {
  // Relative /api/v1 works in the browser; SSR needs an absolute same-origin URL.
  if (typeof window === "undefined") {
    return env.server.apiBaseUrl;
  }
  return env.api.baseUrl;
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingQueue: {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: AxiosRequestConfig;
}[] = [];

function processQueue(error: unknown) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(api(config));
    }
  });
  pendingQueue = [];
}
const NO_REFRESH_PATHS = [
  "/auth/refresh-token",
  "/auth/login",
  "/auth/logout",
  "/auth/me",
];

function shouldAttemptRefresh(config: AxiosRequestConfig) {
  const url = config.url ?? "";
  return !NO_REFRESH_PATHS.some((path) => url.includes(path));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!error.response || !original) {
      return Promise.reject(ApiException.fromAxiosError(error));
    }

    const isUnauthorized = error.response.status === 401;

    if (isUnauthorized && !original._retry && shouldAttemptRefresh(original)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: original });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await authApi.refreshToken();
        processQueue(null);
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError);
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/auth/")
        ) {
          window.location.href = "/auth/sign-in";
        }
        return Promise.reject(
          ApiException.fromAxiosError(refreshError as AxiosError),
        );
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(ApiException.fromAxiosError(error));
  },
);
