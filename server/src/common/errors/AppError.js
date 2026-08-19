const { t } = require("../i18n/t");

class AppError extends Error {
  constructor(
    message,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details = null,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = t("errors.badRequest"), details = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

class ValidationError extends AppError {
  constructor(message = t("errors.validation"), details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = t("errors.unauthorized")) {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = t("errors.forbidden")) {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = t("errors.notFound")) {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = t("errors.conflict"), details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = t("errors.tooManyRequests"), retryAfterSeconds = null) {
    super(
      message,
      429,
      "TOO_MANY_REQUESTS",
      retryAfterSeconds != null ? { retryAfterSeconds } : null,
    );
  }
}

class InternalServerError extends AppError {
  constructor(message = t("errors.internal")) {
    super(message, 500, "INTERNAL_ERROR");
    this.isOperational = false;
  }
}

class IpBlockedError extends AppError {
  constructor(message = t("errors.ipBlocked"), retryAfterSeconds = null) {
    super(
      message,
      429,
      "IP_BLOCKED",
      retryAfterSeconds != null ? { retryAfterSeconds } : null,
    );
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  IpBlockedError,
  InternalServerError,
};
