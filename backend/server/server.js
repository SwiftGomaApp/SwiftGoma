require("./src/instrument");

const createApp = require("./src/app");
const { env } = require("./src/config/env");
const { initSocket } = require("./src/config/socket");
const http = require("http");

const app = createApp();
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Swiftgoma API listening on port ${env.port} [${env.nodeEnv}]`);
});

function crash(label, err) {
  console.error(`[${label}]`, err);
  Sentry.captureException(err);
  Sentry.flush(2000).finally(() => {
    server.close(() => process.exit(1));
    // Force-exit if graceful close hangs.
    setTimeout(() => process.exit(1), 3000).unref();
  });
}

process.on("uncaughtException", (err) => crash("uncaughtException", err));
process.on("unhandledRejection", (reason) =>
  crash("unhandledRejection", reason),
);
