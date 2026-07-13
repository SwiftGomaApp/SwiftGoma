const { isProduction } = require("../../config/env");
const { AppError } = require("../errors");

function normalize(err) {
  if (err instanceof AppError) return err;

  if (
    err.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && "body" in err)
  ) {
    return new AppError("Malformed JSON in request body.", 400, "BAD_REQUEST");
  }

  const fallback = new AppError(
    isProduction ? "Something went wrong on our end." : err.message,
    err.status || err.statusCode || 500,
    "INTERNAL_ERROR",
  );
  fallback.isOperational = false;
  fallback.stack = err.stack;
  return fallback;
}

function errorHandler(err, req, res, next) {
  const normalized = normalize(err);
  const { statusCode, code, message, details, isOperational } = normalized;

  if (!isOperational || statusCode >= 500) {
    console.error(`[${req.id || "no-request-id"}]`, err);
  } else if (!isProduction) {
    console.warn(
      `[${req.id || "no-request-id"}] ${statusCode} ${code}: ${message}`,
    );
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId: req.id || null,
      ...(!isProduction && !isOperational && { stack: err.stack }),
    },
  });
}

module.exports = { errorHandler };
