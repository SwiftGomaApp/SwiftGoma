const express = require("express");
const {
  registerWithGoogle,
  loginWithGoogle,
  linkGoogleAccount,
  unlinkGoogleAccount,
  requestUnlinkGoogleAccount,
  verifyUnlinkGoogleAccount,
} = require("../controllers/google.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.post("/register", registerWithGoogle);
router.post("/login", loginWithGoogle);

router.post("/link", authenticate, requireVerified, linkGoogleAccount);
router.delete("/link", authenticate, requireVerified, unlinkGoogleAccount);

router.post(
  "/unlink/request",
  authenticate,
  requireVerified,
  requestUnlinkGoogleAccount,
);
router.post(
  "/unlink/verify",
  authenticate,
  requireVerified,
  verifyUnlinkGoogleAccount,
);

module.exports = { googleRouter: router };
