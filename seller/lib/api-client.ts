import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

export const API_ERROR_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_EXISTS: "ACCOUNT_EXISTS",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  PHONE_EXISTS: "PHONE_EXISTS",
  INVALID_OTP: "INVALID_OTP",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_RATE_LIMIT: "OTP_RATE_LIMIT",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_REQUEST: "BAD_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SESSION_INVALID: "SESSION_INVALID",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
} as const;

const REFRESHABLE_CODES: string[] = [API_ERROR_CODES.TOKEN_EXPIRED];

const TERMINAL_AUTH_CODES: string[] = [
  API_ERROR_CODES.SESSION_INVALID,
  API_ERROR_CODES.ACCOUNT_DELETED,
  API_ERROR_CODES.FORBIDDEN,
];

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  // headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: unknown) => {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(apiClient(config));
    }
  });
  pendingQueue = [];
};

const redirectToSignIn = () => {
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/auth/sign-in"
  ) {
    window.location.href = "/auth/sign-in";
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const code = error.response?.data?.code;
    const status = error.response?.status;

    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");
    const isLoginCall = originalRequest?.url?.includes("/auth/login");

    const isMeCall = originalRequest?.url?.includes("/auth/me");

    if (
      status === 401 &&
      code &&
      TERMINAL_AUTH_CODES.includes(code) &&
      !isMeCall
    ) {
      redirectToSignIn();
      return Promise.reject(error);
    }

    if (
      status === 401 &&
      code &&
      REFRESHABLE_CODES.includes(code) &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshCall &&
      !isLoginCall
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post("/auth/refresh");
        isRefreshing = false;
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        redirectToSignIn();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message ?? "Une erreur est survenue. Veuillez réessayer.";
  }
  return "Une erreur est survenue. Veuillez réessayer.";
};

export const getApiErrorCode = (error: unknown): string | null => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.code ?? null;
  }
  return null;
};
