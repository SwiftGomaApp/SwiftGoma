import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    // Tells the backend to return tokens in the JSON body instead of
    // setting httpOnly cookies — required since this app runs on its own
    // origin, separate from the cookie-based web app.
    "x-client-type": "mobile",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

let refreshPromise: Promise<void> | null = null;

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const { data } = await axios.post<
    ApiEnvelope<{ accessToken: string; refreshToken: string }>
  >(
    `${API_BASE_URL}/auth/refresh-token`,
    { refreshToken },
    { headers: { "x-client-type": "mobile" } },
  );
  setTokens(data.data.accessToken, data.data.refreshToken);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthEndpoint = (originalRequest?.url ?? "").includes("/auth/");
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      refreshPromise = refreshPromise ?? refreshSession();
      await refreshPromise;
      refreshPromise = null;
      return apiClient(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
      return Promise.reject(refreshError);
    }
  },
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiEnvelope<T>>(url, { params });
  return data.data;
}

export async function apiPost<T>(url: string, body?: unknown) {
  const { data } = await apiClient.post<ApiEnvelope<T>>(url, body);
  return data.data;
}

export function isApiError(err: unknown): err is AxiosError<{
  error?: { message?: string };
}> {
  return axios.isAxiosError(err);
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}
