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

const router = express.Router();

router.use(authenticate);

router.get("/", requireVerified, getSellerProfile);
router.post("/", requireVerified, logoUpload, createSellerProfile);
router.patch("/", requireVerified, logoUpload, updateSellerProfile);

module.exports = { sellerRouter: router };
