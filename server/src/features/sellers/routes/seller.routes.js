"use strict";

const express = require("express");
const {
  authenticate,
  requireVerified,
} = require("../../auth/middlewares/authenticate.middleware");
const { logoUpload } = require("../../../shared/middleware/upload.middleware");
const {
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
} = require("../controllers/seller.controller");
const { requireNotSuspended } = require("../middlewares/onbarding.middleware");

const router = express.Router();

router.use(authenticate);

router.post("/", requireVerified, logoUpload, createSellerProfile);

router.get("/", requireVerified, requireNotSuspended, getSellerProfile);
router.patch(
  "/",
  requireVerified,
  requireNotSuspended,
  logoUpload,
  updateSellerProfile,
);

module.exports = { sellerRouter: router };
