const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");
const { sentry_dsn, node_env } = require("./config/env.config");

Sentry.init({
  dsn: sentry_dsn,
  environment: node_env || "development",
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: node_env === "production" ? 0.1 : 1.0,
  profileSampleRate: 1.0,
  enabled: !!sentry_dsn,
  beforeSend(event) {
    if (node_env === "development" && !sentry_dsn) {
      return null;
    }
    return event;
  },
});
