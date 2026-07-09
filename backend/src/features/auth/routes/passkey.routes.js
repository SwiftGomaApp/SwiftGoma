const express = require("express");
const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  listPasskeys,
  removePasskey,
  requestRemovePasskeyHandler,
} = require("../controllers/passkey.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.get("/auth/options", getAuthenticationOptions);
router.post("/auth/verify", verifyAuthentication);

router.get("/", authenticate, requireVerified, listPasskeys);
router.get(
  "/register/options",
  authenticate,
  requireVerified,
  getRegistrationOptions,
);
router.post(
  "/register/verify",
  authenticate,
  requireVerified,
  verifyRegistration,
);
router.post(
  "/:id/remove/request",
  authenticate,
  requireVerified,
  requestRemovePasskeyHandler,
);
router.delete("/:id", authenticate, requireVerified, removePasskey);

module.exports = { passkeyRouter: router };
