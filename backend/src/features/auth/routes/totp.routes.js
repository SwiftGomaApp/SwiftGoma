const express = require("express");
const {
  setupTotp,
  enableTotp,
  verifyTotp,
  disableTotp,
  regenerateBackupCodes,
  requestRegenerateBackupCodes,
  requestDisableTotp,
} = require("../controllers/totp.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.post("/verify", verifyTotp);

router.post("/setup", authenticate, requireVerified, setupTotp);
router.post("/enable", authenticate, requireVerified, enableTotp);
router.post(
  "/disable/request",
  authenticate,
  requireVerified,
  requestDisableTotp,
);
router.post("/disable", authenticate, requireVerified, disableTotp);
router.post(
  "/backup-codes/request",
  authenticate,
  requireVerified,
  requestRegenerateBackupCodes,
);
router.post(
  "/backup-codes/regenerate",
  authenticate,
  requireVerified,
  regenerateBackupCodes,
);

module.exports = { totpRouter: router };
