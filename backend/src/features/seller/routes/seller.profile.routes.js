const express = require("express");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  createSellerProfile,
  getSellerProfile,
} = require("../controllers/seller.profile.controller");

const sellerProfileRouter = express.Router();

sellerProfileRouter.post(
  "/",
  authenticate,
  requireRole("SELLER"),
  createSellerProfile,
);
sellerProfileRouter.get(
  "/",
  authenticate,
  requireRole("SELLER"),
  getSellerProfile,
);

module.exports = { sellerProfileRouter };
