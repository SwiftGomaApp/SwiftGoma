const Sentry = require("@sentry/node");
const { env, isProduction } = require("./config/env");

if (env.sentryDsn) {
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    disableInstrumentationWarnings: true,
  });
} else if (!isProduction) {
  console.warn("SENTRY_DSN not set — Sentry error monitoring is disabled.");
}

module.exports = Sentry;
