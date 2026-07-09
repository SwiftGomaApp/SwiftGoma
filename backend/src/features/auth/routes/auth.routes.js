const { Router } = require("express");
const {
  register,
  verifyAccount,
  resendOtp,
  loginWithOtp,
  verifyLoginOtp,
  createPassword,
  loginWithPassword,
  forgotPassword,
  resetPassword,
  getMe,
  updatePassword,
  refresh,
  logout,
  logoutAll,
} = require("../controllers/auth.controller");
const {
  authLimiter,
  otpLimiter,
} = require("../../../shared/middleware/rateLimiter");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const authRouter = Router();

authRouter.post("/register", authLimiter, register);
authRouter.post("/verify-account", authLimiter, verifyAccount);
authRouter.post("/resend-otp", otpLimiter, resendOtp);

authRouter.post("/login/otp", authLimiter, loginWithOtp);
authRouter.post("/login/otp/verify", authLimiter, verifyLoginOtp);
authRouter.post("/login/password", authLimiter, loginWithPassword);

authRouter.get("/me", authenticate, requireVerified, getMe);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/logout/all", authenticate, logoutAll);

authRouter.post(
  "/password/create",
  authenticate,
  requireVerified,
  createPassword,
);
authRouter.post("/password/forgot", authLimiter, forgotPassword);
authRouter.post("/password/reset", authLimiter, resetPassword);

authRouter.patch(
  "/password/update",
  authenticate,
  requireVerified,
  updatePassword,
);

module.exports = { authRouter };
