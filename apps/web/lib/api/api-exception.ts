import { AxiosError } from "axios";

type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

type ApiErrorBody = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details: unknown;
    requestId: string | null;
  };
};

export class ApiException extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number | null;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor(
    message: string,
    code: ApiErrorCode,
    statusCode: number | null,
    details: unknown = null,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiException";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }

  static fromAxiosError(error: AxiosError): ApiException {
    if (!error.response) {
      return new ApiException(
        "Impossible de contacter le serveur. Vérifiez votre connexion.",
        "NETWORK_ERROR",
        null,
      );
    }

    const body = error.response.data as Partial<ApiErrorBody> | undefined;

    if (body?.error?.code) {
      return new ApiException(
        body.error.message,
        body.error.code,
        error.response.status,
        body.error.details ?? null,
        body.error.requestId ?? null,
      );
    }

    return new ApiException(
      "Une erreur inattendue est survenue.",
      "INTERNAL_ERROR",
      error.response.status,
    );
  }

  get isValidationError() {
    return this.code === "VALIDATION_ERROR";
  }

  get isAuthError() {
    return this.code === "UNAUTHORIZED" || this.code === "FORBIDDEN";
  }

  get isNetworkError() {
    return this.code === "NETWORK_ERROR";
  }

  get isRateLimited() {
    return this.code === "TOO_MANY_REQUESTS";
  }
}
