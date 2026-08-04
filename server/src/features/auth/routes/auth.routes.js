const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authLimiter } = require("../../../common/middleware/rateLimiters");

const AuthRouter = express.Router();

// authLimiter is applied only to the endpoints that are actually
// brute-forceable / abusable (credential guessing, OTP guessing, OTP/SMS
// spam, registration spam) — NOT to routes like /refresh-token, /logout, or
// /me, which legitimate clients call routinely per session and which a
// blanket limiter would throttle for real users without stopping abuse
// (those require an existing valid token/session already).
AuthRouter.post("/create-account", authLimiter, authController.createAccount);
AuthRouter.post("/verify-email", authLimiter, authController.verifyEmail);
AuthRouter.post(
  "/resend-verification",
  authLimiter,
  authController.resendEmailVerification,
);
AuthRouter.post(
  "/login/request-otp",
  authLimiter,
  authController.requestLoginOtp,
);
AuthRouter.post(
  "/login/verify-otp",
  authLimiter,
  authController.verifyLoginOtp,
);
AuthRouter.post(
  "/login/password",
  authLimiter,
  authController.loginWithPassword,
);
AuthRouter.post("/login/totp", authLimiter, authController.loginWithTotp);
AuthRouter.post(
  "/register/google",
  authLimiter,
  authController.registerWithGoogle,
);
AuthRouter.post("/login/google", authLimiter, authController.loginWithGoogle);
AuthRouter.post("/refresh-token", authController.refreshAccessToken);
AuthRouter.get("/me", authenticate, authController.getMe);
AuthRouter.post("/logout", authenticate, authController.logout);
AuthRouter.post("/logout-all", authenticate, authController.logoutAll);
AuthRouter.get("/sessions", authenticate, authController.listSessions);
AuthRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  authLimiter,
  authController.revokeSession,
);
AuthRouter.post(
  "/password/create",
  authenticate,
  authController.createPassword,
);
AuthRouter.post(
  "/password/update",
  authenticate,
  authController.updatePassword,
);
AuthRouter.post("/password/forgot", authLimiter, authController.forgotPassword);
AuthRouter.post("/password/reset", authLimiter, authController.resetPassword);
AuthRouter.post("/totp/setup", authenticate, authController.setupTotp);
AuthRouter.post("/totp/confirm", authenticate, authController.confirmTotp);
AuthRouter.post("/totp/disable", authenticate, authController.disableTotp);
AuthRouter.post(
  "/totp/regenerate-backup-codes",
  authenticate,
  authController.regenerateBackupCodes,
);

AuthRouter.post(
  "/passkey/register/options",
  authenticate,
  authController.generatePasskeyRegistrationOptions,
);
AuthRouter.post(
  "/passkey/register/verify",
  authenticate,
  authController.verifyPasskeyRegistration,
);
AuthRouter.post(
  "/passkey/login/options",
  authLimiter,
  authController.generatePasskeyLoginOptions,
);
AuthRouter.post(
  "/passkey/login/verify",
  authLimiter,
  authController.verifyPasskeyLogin,
);
AuthRouter.get("/passkey", authenticate, authController.listPasskeys);
AuthRouter.delete(
  "/passkey/:passkeyId",
  authenticate,
  authController.deletePasskey,
);

module.exports = AuthRouter;
