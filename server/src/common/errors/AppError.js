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
  constructor(message = "Requête invalide.", details = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Échec de la validation.", details = null) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Vous n'avez pas la permission d'effectuer cette action.") {
    super(message, 403, "FORBIDDEN");
  }
}

class NotFoundError extends AppError {
  constructor(message = "Ressource introuvable.") {
    super(message, 404, "NOT_FOUND");
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflit avec des données existantes.", details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = "Trop de requêtes. Veuillez ralentir.") {
    super(message, 429, "TOO_MANY_REQUESTS");
  }
}

class InternalServerError extends AppError {
  constructor(message = "Une erreur interne s'est produite.") {
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
