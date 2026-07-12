const express = require("express");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const { handleKycUpload } = require("../middleware/kycUpload.middleware");
const {
  submitKyc,
  getKyc,
  listPendingKyc,
  reviewKyc,
} = require("../controllers/seller.kyc.controller");

const sellerKycRouter = express.Router();

sellerKycRouter.post(
  "/",
  authenticate,
  requireRole("SELLER"),
  handleKycUpload,
  submitKyc,
);
sellerKycRouter.get("/", authenticate, requireRole("SELLER"), getKyc);

sellerKycRouter.get(
  "/pending",
  authenticate,
  requireRole("SUPPORT", "ADMIN"),
  listPendingKyc,
);
sellerKycRouter.post(
  "/:kycId/review",
  authenticate,
  requireRole("SUPPORT", "ADMIN"),
  reviewKyc,
);

module.exports = { sellerKycRouter };
