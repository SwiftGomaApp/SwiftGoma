const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const Sentry = require("@sentry/node");

const { env, isProduction } = require("./config/env");
const { checkCloudinaryConnection } = require("./config/cloudinary");
const { checkMailerConnection } = require("./config/mailer");
const { checkDatabaseConnection } = require("./config/prisma");
const { checkSmsConnection } = require("./config/sms");
const { botDetection } = require("./common/middleware/botDetection");
const { errorHandler } = require("./common/middleware/errorHandler");
const { notFound } = require("./common/middleware/notFound");
const { checkOneSignalConnection } = require("./config/oneSignal");
const {
  checkPawaPayConnection,
} = require("../src/features/payments/config/pawapay.config");
const {
  globalLimiter,
  authLimiter,
} = require("./common/middleware/rateLimiters");
const { requestId } = require("./common/middleware/requestId");
const authRoutes = require("./features/auth/routes/auth.routes");
const UserRouter = require("./features/users/routes/user.routes");
const NotificationRouter = require("./features/notification/routes/notification.routes");
const SellerRouter = require("./features/seller/routes/seller.routes");
const PawapayRouter = require("./features/payments/routes/pawapay.routes");
const PlansRouter = require("./features/plans/routes/plans.routes");

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

  app.get("/api/v1/health", async (req, res) => {
    const [
      db,
      cloudinaryStatus,
      mailerStatus,
      smsStatus,
      oneSignalStatus,
      pawapayStatus,
    ] = await Promise.all([
      checkDatabaseConnection(),
      checkCloudinaryConnection(),
      checkMailerConnection(),
      checkSmsConnection(),
      checkOneSignalConnection(),
      checkPawaPayConnection(),
    ]);
    const healthy =
      db.connected &&
      cloudinaryStatus.connected &&
      mailerStatus.connected &&
      smsStatus.connected &&
      oneSignalStatus.connected &&
      pawapayStatus.connected;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
      database: db,
      cloudinary: cloudinaryStatus,
      mailer: mailerStatus,
      sms: smsStatus,
      oneSignal: oneSignalStatus,
      pawapay: pawapayStatus,
    });
  });

  app.use(
    "/api/v1/auth",
    // botDetection({ mode: "block" }),
    // authLimiter,
    authRoutes,
  );
  app.use(
    "/api/v1/users",
    // botDetection({ mode: "block" }),
    // authLimiter,
    UserRouter,
  );

  app.use("/api/v1/notifications", NotificationRouter);
  app.use("/api/v1/seller", SellerRouter);
  app.use("/api/v1/pawapay", PawapayRouter);
  app.use("/api/v1/plans", PlansRouter);

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
