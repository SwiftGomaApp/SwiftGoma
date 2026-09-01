const { isbot } = require("isbot");

const { ForbiddenError } = require("../errors");
const { env } = require("../../config/env");

const isProduction = env.nodeEnv === "production";

const TRUSTED_USER_AGENT_PREFIXES = [
  "SwiftGomaAdmin-Server/",
  "SwiftGomaWeb-Server/",
];

function looksLikeBot(req) {
  const userAgent = req.headers["user-agent"] || "";
  if (!userAgent) return true;
  if (
    TRUSTED_USER_AGENT_PREFIXES.some((prefix) => userAgent.startsWith(prefix))
  ) {
    return false;
  }
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

      if (mode === "block" && isProduction) {
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

function blockSuspectedBots(req, res, next) {
  if (req.isSuspectedBot && isProduction) {
    return next(
      new ForbiddenError("Automated access is not allowed on this endpoint."),
    );
  }
  next();
}

module.exports = { botDetection, blockSuspectedBots };
