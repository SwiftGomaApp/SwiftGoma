"use strict";

const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const { kycUpload } = require("../middlewares/kyc-upload.middleware");
const kycController = require("../controllers/kyc.controller");
const { requireNotSuspended } = require("../middlewares/onbarding.middleware");

const router = express.Router();

router.use(authenticate);

router.post(
  "/seller/kyc",
  requireVerified,
  requireNotSuspended,
  kycUpload,
  kycController.submitKyc,
);
router.get(
  "/seller/kyc",
  requireVerified,
  requireNotSuspended,
  kycController.getMyKycStatus,
);

router.get(
  "/support/kyc",
  requireRole("ADMIN", "SUPPORT"),
  kycController.listPendingKyc,
);
router.patch(
  "/support/kyc/:sellerProfileId",
  requireRole("ADMIN", "SUPPORT"),
  kycController.reviewKyc,
);

module.exports = { kycRouter: router };
