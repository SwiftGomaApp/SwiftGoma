const { AppError } = require("./app.error");
const { Prisma } = require("@prisma/client");

const handlePrismaError = (err) => {
  switch (err.code) {
    case "P2002":
      return new AppError("Cette valeur existe déjà.", 409, "DUPLICATE_ENTRY");
    case "P2025":
      return new AppError("Enregistrement introuvable.", 404, "NOT_FOUND");
    case "P2003":
      return new AppError("Référence invalide.", 400, "INVALID_REFERENCE");
    default:
      return new AppError("Erreur base de données.", 500, "DB_ERROR");
  }
};

const handleJwtError = (err) => {
  if (err.name === "TokenExpiredError") {
    return new AppError(
      "Votre session a expiré. Veuillez vous reconnecter.",
      401,
      "TOKEN_EXPIRED",
    );
  }
  return new AppError("Token invalide.", 401, "INVALID_TOKEN");
};

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  }

  // JWT errors
  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
    error = handleJwtError(err);
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: err.errors.map((e) => e.message).join(", "),
      errors: err.errors,
    });
  }

  // Operational errors — safe to send to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }

  // Unknown errors — log and send generic message
  console.error("💥 Unhandled error:", err);

  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: "Une erreur interne est survenue.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
