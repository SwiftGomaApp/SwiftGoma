const express = require("express");

const authController = require("../controllers/auth.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const AuthRouter = express.Router();

AuthRouter.post("/create-account", authController.createAccount);
AuthRouter.post("/verify-email", authController.verifyEmail);
AuthRouter.post("/resend-verification", authController.resendEmailVerification);
AuthRouter.post("/login/request-otp", authController.requestLoginOtp);
AuthRouter.post("/login/verify-otp", authController.verifyLoginOtp);
AuthRouter.post("/login/password", authController.loginWithPassword);
AuthRouter.post("/login/totp", authController.loginWithTotp);
AuthRouter.post("/register/google", authController.registerWithGoogle);
AuthRouter.post("/login/google", authController.loginWithGoogle);
AuthRouter.post("/refresh-token", authController.refreshAccessToken);
AuthRouter.get("/me", authenticate, authController.getMe);
AuthRouter.post("/logout", authenticate, authController.logout);
AuthRouter.post("/logout-all", authenticate, authController.logoutAll);
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
AuthRouter.post("/password/forgot", authController.forgotPassword);
AuthRouter.post("/password/reset", authController.resetPassword);
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
  authController.generatePasskeyLoginOptions,
);
AuthRouter.post("/passkey/login/verify", authController.verifyPasskeyLogin);
AuthRouter.get("/passkey", authenticate, authController.listPasskeys);
AuthRouter.delete(
  "/passkey/:passkeyId",
  authenticate,
  authController.deletePasskey,
);

module.exports = AuthRouter;
