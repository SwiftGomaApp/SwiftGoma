const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const Sentry = require("@sentry/node");

const { env, isProduction } = require("./config/env");
const { botDetection } = require("./common/middleware/botDetection");
const { errorHandler } = require("./common/middleware/errorHandler");
const { notFound } = require("./common/middleware/notFound");
const { globalLimiter } = require("./common/middleware/rateLimiters");
const { requestId } = require("./common/middleware/requestId");
const { checkDatabaseConnection } = require("./config/prisma");
const { checkCloudinaryConnection } = require("./config/cloudinary");
const { checkMailerConnection } = require("./config/mailer");
const { checkSmsConnection } = require("./config/sms");

const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
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

  app.use(botDetection({ mode: "flag" }));

  app.use(globalLimiter);

  app.get("/health", async (req, res) => {
    const [db, cloudinaryStatus, mailerStatus, smsStatus] = await Promise.all([
      checkDatabaseConnection(),
      checkCloudinaryConnection(),
      checkMailerConnection(),
      checkSmsConnection(),
    ]);
    const healthy =
      db.connected &&
      cloudinaryStatus.connected &&
      mailerStatus.connected &&
      smsStatus.connected;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
      database: db,
      cloudinary: cloudinaryStatus,
      mailer: mailerStatus,
      sms: smsStatus,
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
