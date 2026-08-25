const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const {
  blockSuspectedBots,
} = require("../../../common/middleware/botDetection");
const {
  sessionLimiter,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  otpRequestLimiter,
  otpRequestAccountLimiter,
  accountLimiter,
  authenticatedActionLimiter,
  refreshTokenLimiter,
} = require("../../../common/middleware/rateLimiters");

const AuthRouter = express.Router();

// --- Tier C: account creation / social login ---
AuthRouter.post(
  "/create-account",
  blockSuspectedBots,
  accountLimiter,
  authController.createAccount,
);
AuthRouter.post(
  "/verify-email",
  blockSuspectedBots,
  accountLimiter,
  authController.verifyEmail,
);
AuthRouter.post(
  "/register/google",
  blockSuspectedBots,
  accountLimiter,
  authController.registerWithGoogle,
);
AuthRouter.post(
  "/login/google",
  blockSuspectedBots,
  accountLimiter,
  authController.loginWithGoogle,
);

// --- Tier B: request/initiation (spam & enumeration risk) ---
AuthRouter.post(
  "/resend-verification",
  blockSuspectedBots,
  otpRequestLimiter,
  otpRequestAccountLimiter,
  authController.resendEmailVerification,
);
AuthRouter.post(
  "/login/request-otp",
  blockSuspectedBots,
  otpRequestLimiter,
  otpRequestAccountLimiter,
  authController.requestLoginOtp,
);
AuthRouter.post(
  "/passkey/login/options",
  blockSuspectedBots,
  otpRequestLimiter,
  otpRequestAccountLimiter,
  authController.generatePasskeyLoginOptions,
);
AuthRouter.post(
  "/password/forgot",
  blockSuspectedBots,
  otpRequestLimiter,
  otpRequestAccountLimiter,
  authController.forgotPassword,
);

// --- Tier A: credential guessing (tight, feeds IP auto-block) ---
AuthRouter.post(
  "/login/verify-otp",
  blockSuspectedBots,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  authController.verifyLoginOtp,
);
AuthRouter.post(
  "/login/password",
  blockSuspectedBots,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  authController.loginWithPassword,
);
AuthRouter.post(
  "/login/totp",
  blockSuspectedBots,
  credentialGuessLimiter,
  authController.loginWithTotp,
);
AuthRouter.post(
  "/passkey/login/verify",
  blockSuspectedBots,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  authController.verifyPasskeyLogin,
);
AuthRouter.post(
  "/password/reset",
  blockSuspectedBots,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  authController.resetPassword,
);
AuthRouter.post(
  "/password/update",
  authenticate,
  credentialGuessLimiter,
  authController.updatePassword,
);
AuthRouter.post(
  "/totp/confirm",
  authenticate,
  credentialGuessLimiter,
  authController.confirmTotp,
);
AuthRouter.post(
  "/totp/disable",
  authenticate,
  credentialGuessLimiter,
  authController.disableTotp,
);

// --- Session management (unchanged) ---
AuthRouter.post(
  "/refresh-token",
  refreshTokenLimiter,
  authController.refreshAccessToken,
);
AuthRouter.get("/me", authenticate, sessionLimiter, authController.getMe);
AuthRouter.post("/logout", authenticate, sessionLimiter, authController.logout);
AuthRouter.post(
  "/logout-all",
  authenticate,
  sessionLimiter,
  authController.logoutAll,
);
AuthRouter.get(
  "/sessions",
  authenticate,
  sessionLimiter,
  authController.listSessions,
);
AuthRouter.delete(
  "/sessions/:sessionId",
  authenticate,
  sessionLimiter,
  authController.revokeSession,
);

// --- Tier D: authenticated, non-guessable setup actions ---
AuthRouter.post(
  "/password/create",
  authenticate,
  authenticatedActionLimiter,
  authController.createPassword,
);
AuthRouter.post(
  "/totp/setup",
  authenticate,
  authenticatedActionLimiter,
  authController.setupTotp,
);
AuthRouter.post(
  "/totp/regenerate-backup-codes",
  authenticate,
  authenticatedActionLimiter,
  authController.regenerateBackupCodes,
);
AuthRouter.post(
  "/passkey/register/options",
  authenticate,
  authenticatedActionLimiter,
  authController.generatePasskeyRegistrationOptions,
);
AuthRouter.post(
  "/passkey/register/verify",
  authenticate,
  authenticatedActionLimiter,
  authController.verifyPasskeyRegistration,
);
AuthRouter.get(
  "/passkey",
  authenticate,
  sessionLimiter,
  authController.listPasskeys,
);
AuthRouter.delete(
  "/passkey/:passkeyId",
  authenticate,
  sessionLimiter,
  authController.deletePasskey,
);

module.exports = AuthRouter;
