const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const Sentry = require("@sentry/node");
const { errorHandler } = require("./common/middleware/errorHandler");
const { notFound } = require("./common/middleware/notFound");
const { requestId } = require("./common/middleware/requestId");

const { env, isProduction } = require("./config/env");

const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigins.length ? env.clientOrigins : true,
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // Routes here

  app.use(notFound);

  Sentry.setupExpressErrorHandler(app, {
    shouldHandleError(err) {
      const status = err.status || err.statusCode || 500;
      return err.isOperational === false || status >= 500;
    },
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
