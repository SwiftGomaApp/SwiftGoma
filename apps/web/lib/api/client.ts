import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { ApiException } from "./api-exception";
import { env } from "./config/env";
import { authApi } from "./routes/auth";

function resolveApiBaseUrl(): string {
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

let refreshPromise: Promise<void> | null = null;

export function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = authApi
      .refreshToken()
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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
      original._retry = true;

      try {
        await refreshSession();
        return api(original);
      } catch (refreshError) {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/auth/")
        ) {
          window.location.href = "/auth/sign-in";
        }
        return Promise.reject(
          ApiException.fromAxiosError(refreshError as AxiosError),
        );
      }
    }

    return Promise.reject(ApiException.fromAxiosError(error));
  },
);
