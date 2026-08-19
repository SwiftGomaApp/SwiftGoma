const { isProduction } = require("../../config/env");
const { AppError } = require("../errors");
const { t } = require("../i18n/t");

function normalize(err) {
  if (err instanceof AppError) return err;

  if (
    err.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && "body" in err)
  ) {
    return new AppError(t("errors.malformedJson"), 400, "BAD_REQUEST");
  }

  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: t("errors.upload.fileTooLarge"),
      LIMIT_FILE_COUNT: t("errors.upload.tooManyFiles"),
      LIMIT_UNEXPECTED_FILE: t("errors.upload.unexpectedField"),
    };
    return new AppError(
      messages[err.code] || t("errors.upload.generic"),
      400,
      "BAD_REQUEST",
    );
  }

  const fallback = new AppError(
    isProduction ? t("errors.internal") : err.message,
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
