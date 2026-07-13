const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const Sentry = require("@sentry/node");

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

  Sentry.setupExpressErrorHandler(app);

  return app;
};

module.exports = createApp;
