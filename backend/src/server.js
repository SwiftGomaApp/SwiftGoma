require("dotenv").config();
require("./instrument");
const Sentry = require("@sentry/node");
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const { port, cookie_secret } = require("./config/env.config");
const { applySecurityMiddleware } = require("./shared/middleware/security");
const { globalLimiter } = require("./shared/middleware/rateLimiter");
const { errorHandler } = require("./shared/errors/error.handler");
const { prisma } = require("./config/db.config");
const { redis } = require("./config/redis.config");
const { initSocket } = require("./config/socket.config");
const { authRouter } = require("./features/auth/routes/auth.routes");
const { totpRouter } = require("./features/auth/routes/totp.routes");
const { passkeyRouter } = require("./features/auth/routes/passkey.routes");
const { googleRouter } = require("./features/auth/routes/google.routes");
const { sessionRouter } = require("./features/auth/routes/session.routes");
const { emailRouter } = require("./features/auth/routes/email.routes");
const { phoneRouter } = require("./features/auth/routes/phone.routes");
const { usersRouter } = require("./features/users/routes/users.routes");
const {
  validatePawaPayConfig,
} = require("./features/pawapay/config/pawapay.config");
const { pawapayRouter } = require("./features/pawapay/routes/pawapay.routes");
const {
  sellerProfileRouter,
} = require("./features/seller/routes/seller.profile.routes");

const app = express();

app.set("trust proxy", 1);

const server = http.createServer(app);

applySecurityMiddleware(app);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser(cookie_secret));
app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "SwiftGoma API." });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth/totp", totpRouter);
app.use("/api/v1/auth/passkeys", passkeyRouter);
app.use("/api/v1/auth/google", googleRouter);
app.use("/api/v1/auth/sessions", sessionRouter);
app.use("/api/v1/auth/email", emailRouter);
app.use("/api/v1/auth/phone", phoneRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/pawapay", pawapayRouter);
app.use("/api/v1/seller-profile", sellerProfileRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} introuvable.`,
  });
});

Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// ─── Boot ─────────────────────────────────────────────────────────────────────

initSocket(server);

prisma
  .$connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch((err) => {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1);
  });

redis.connect().catch((err) => {
  console.error("❌ Redis connection failed:", err.message);
  process.exit(1);
});

// startHealthCheckCron();
// startAccountCleanupCron();
// startSubscriptionCron();
// startOrderCron();
validatePawaPayConfig();

server.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
