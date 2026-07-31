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
  constructor(message = "Bad request.", details = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed.", details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to do that.") {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "This conflicts with existing data.", details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

class InternalServerError extends AppError {
  constructor(message = "Something went wrong on our end.") {
    super(message, 500, "INTERNAL_ERROR");
    this.isOperational = false;
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
  InternalServerError,
};
