const { isbot } = require("isbot");

const { ForbiddenError } = require("../errors");

function looksLikeBot(req) {
  const userAgent = req.headers["user-agent"] || "";
  if (!userAgent) return true;
  return isbot(userAgent);
}

function botDetection({ mode = "flag" } = {}) {
  return (req, res, next) => {
    const suspected = looksLikeBot(req);
    req.isSuspectedBot = suspected;

    if (suspected) {
      console.warn(
        `[${req.id || "no-request-id"}] Suspected bot (${mode}): ` +
          `UA="${req.headers["user-agent"] || ""}" ${req.method} ${req.originalUrl}`,
      );

      if (mode === "block") {
        return next(
          new ForbiddenError(
            "Automated access is not allowed on this endpoint.",
          ),
        );
      }
    }

    next();
  };
}

module.exports = { botDetection };
