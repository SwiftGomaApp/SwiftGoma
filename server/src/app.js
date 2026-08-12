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
const PawapayCallbackRouter = require("./features/payments/routes/pawapayCallback.routes");
const SubscriptionRouter = require("./features/subscriptions/routes/subscription.routes");
const InvoiceRouter = require("./features/invoicing/routes/invoice.routes");
const DashboardRouter = require("./features/dashboard/routes/dashboard.routes");
const WalletSettingsRouter = require("./features/wallet/routes/walletSettings.routes");
const ProductRouter = require("./features/product/routes/product.routes");
const RiderRouter = require("./features/seller/routes/rider.routes");
const {
  checkMbiyoPayConnection,
} = require("./features/payments/config/mbiopay.config");
const MbiyoPayCallbackRouter = require("./features/payments/routes/mbiyopayCallback.routes");
const MbiyoPayRouter = require("./features/payments/routes/mbiopay.routes");
const AdminTransactionsRouter = require("./features/payments/routes/adminTransactions.routes");
const PaymentLedgerRouter =
  require("./features/payments/routes/adminTransactions.routes").PaymentLedgerRouter;
const CartRouter = require("./features/orders/routes/cart.routes");
const OrderRouter = require("./features/orders/routes/order.routes");
const FavoriteRouter = require("./features/favorites/routes/favorite.routes");
const SupportRouter = require("./features/support/routes/support.routes");
const IncidentRouter = require("./features/incidents/routes/incident.routes");
const BlogRouter = require("./features/blog/routes/blog.routes");
const WalletRouter = require("./features/wallet/routes/wallet.routes");
const AccountingRouter = require("./features/accounting/routes/accounting.routes");
const ExpenseRouter = require("./features/expenses/routes/expense.routes");
const AdminOrderRouter = require("./features/orders/routes/adminOrder.routes");
const AdminProductRouter = require("./features/product/routes/adminProduct.routes");
const AdminSubscriptionRouter = require("./features/subscriptions/routes/adminSubscription.routes");
const AdminInvoiceRouter = require("./features/invoicing/routes/adminInvoice.routes");

const createApp = () => {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
  app.use(helmet());

  if (isProduction && env.clientOrigins.length === 0) {
    throw new Error(
      "[app] CLIENT_ORIGINS must be set in production — refusing to start with an open CORS policy.",
    );
  }

  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.use(botDetection({ mode: "flag" }));

  // if (isProduction) {
  //   app.set("trust proxy", 1);
  // }

  app.set("trust proxy", 1);

  app.use(globalLimiter);

  app.use("/api/v1/pawapay/callbacks", PawapayCallbackRouter);
  app.use("/api/v1/mbiyopay/callbacks", MbiyoPayCallbackRouter);

  app.get("/api/v1/health", async (req, res) => {
    const [
      db,
      cloudinaryStatus,
      mailerStatus,
      smsStatus,
      oneSignalStatus,
      pawapayStatus,
      mbiyopayStatus,
    ] = await Promise.all([
      checkDatabaseConnection(),
      checkCloudinaryConnection(),
      checkMailerConnection(),
      checkSmsConnection(),
      checkOneSignalConnection(),
      checkPawaPayConnection(),
      checkMbiyoPayConnection(),
    ]);
    const healthy =
      db.connected &&
      cloudinaryStatus.connected &&
      mailerStatus.connected &&
      smsStatus.connected &&
      oneSignalStatus.connected &&
      pawapayStatus.connected &&
      mbiyopayStatus.connected;

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
      mbiyopay: mbiyopayStatus,
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
  app.use("/api/v1/payments/transactions", AdminTransactionsRouter);
  app.use("/api/v1/payments/ledger", PaymentLedgerRouter);
  app.use("/api/v1/plans", PlansRouter);
  app.use("/api/v1/subscriptions/admin", AdminSubscriptionRouter);
  app.use("/api/v1/subscriptions", SubscriptionRouter);
  app.use("/api/v1/invoices/admin", AdminInvoiceRouter);
  app.use("/api/v1/invoices", InvoiceRouter);
  app.use("/api/v1/dashboard", DashboardRouter);
  app.use("/api/v1/wallet-settings", WalletSettingsRouter);
  app.use("/api/v1/wallet", WalletRouter);
  app.use("/api/v1/orders/admin", AdminOrderRouter);
  app.use("/api/v1/orders", OrderRouter);
  app.use("/api/v1/products/admin", AdminProductRouter);
  app.use("/api/v1/products", ProductRouter);
  app.use("/api/v1/riders", RiderRouter);
  app.use("/api/v1/mbiyopay", MbiyoPayRouter);
  app.use("/api/v1/cart", CartRouter);
  app.use("/api/v1/favorites", FavoriteRouter);
  app.use("/api/v1/support", SupportRouter);
  app.use("/api/v1/incidents", IncidentRouter);
  app.use("/api/v1/blog", BlogRouter);
  app.use("/api/v1/accounting", AccountingRouter);
  app.use("/api/v1/expenses", ExpenseRouter);

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
