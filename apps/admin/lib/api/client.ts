import axios, { AxiosError, type AxiosInstance } from "axios";
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorShape>) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      original &&
      !original.url?.includes("/auth/refresh-token") &&
      !(original as any)._retried
    ) {
      (original as any)._retried = true;

      if (isRefreshing) {
        await queueUntilRefreshed();
        return apiClient(original);
      }

      isRefreshing = true;
      try {
        await apiClient.post("/auth/refresh-token");
        isRefreshing = false;
        flushRefreshWaiters();
        return apiClient(original);
      } catch (refreshErr) {
        isRefreshing = false;
        flushRefreshWaiters();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
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
