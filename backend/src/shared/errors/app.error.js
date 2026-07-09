class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errors = {
  // Auth
  invalidCredentials: () =>
    new AppError("Identifiants incorrects.", 401, "INVALID_CREDENTIALS"),
  accountNotFound: () =>
    new AppError(
      "Aucun compte associé à cet identifiant.",
      404,
      "ACCOUNT_NOT_FOUND",
    ),
  accountAlreadyExists: () =>
    new AppError(
      "Un compte existe déjà avec cet identifiant.",
      409,
      "ACCOUNT_EXISTS",
    ),
  emailAlreadyExists: () =>
    new AppError("Cette adresse email est déjà utilisée.", 409, "EMAIL_EXISTS"),
  phoneAlreadyExists: () =>
    new AppError(
      "Ce numéro de téléphone est déjà utilisé.",
      409,
      "PHONE_EXISTS",
    ),
  invalidOtp: () =>
    new AppError("Code OTP invalide ou expiré.", 401, "INVALID_OTP"),
  otpExpired: () =>
    new AppError(
      "Ce code OTP a expiré. Veuillez en demander un nouveau.",
      401,
      "OTP_EXPIRED",
    ),
  tooManyOtpRequests: () =>
    new AppError(
      "Trop de tentatives. Réessayez dans quelques minutes.",
      429,
      "OTP_RATE_LIMIT",
    ),
  unauthorized: () =>
    new AppError(
      "Vous devez être connecté pour accéder à cette ressource.",
      401,
      "UNAUTHORIZED",
    ),
  forbidden: () =>
    new AppError(
      "Vous n'avez pas les droits pour effectuer cette action.",
      403,
      "FORBIDDEN",
    ),
  tokenExpired: () =>
    new AppError(
      "Votre session a expiré. Veuillez vous reconnecter.",
      401,
      "TOKEN_EXPIRED",
    ),
  invalidToken: () => new AppError("Token invalide.", 401, "INVALID_TOKEN"),
  // General
  notFound: (resource = "Ressource") =>
    new AppError(`${resource} introuvable.`, 404, "NOT_FOUND"),
  badRequest: (msg) => new AppError(msg, 400, "BAD_REQUEST"),
  internal: () =>
    new AppError(
      "Une erreur interne est survenue. Veuillez réessayer.",
      500,
      "INTERNAL_ERROR",
    ),
  sessionInvalid: () =>
    new AppError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
      401,
      "SESSION_INVALID",
    ),
  accountDeleted: () =>
    new AppError("Ce compte a été supprimé.", 401, "ACCOUNT_DELETED"),
};

module.exports = { AppError, errors };
