"use strict";

const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const sellerService = require("../services/seller.service");

const getSellerProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.getSellerProfile({ userId: req.user.id });
  res.status(200).json({ success: true, data: profile });
});

const createSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const logoUrl = req.file?.path;
  if (!logoUrl) {
    throw errors.badRequest("Le logo de la boutique est requis.");
  }

  const profile = await sellerService.createSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl,
  });

  res.status(201).json({ success: true, data: profile });
});

const updateSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const logoUrl = req.file?.path;

  const profile = await sellerService.updateSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl,
  });

  res.status(200).json({ success: true, data: profile });
});

module.exports = {
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
};
