"use strict";

const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const sellerService = require("../services/seller.service");

/**
 * All of these sit behind `authenticate` (+ `requireVerified` for the
 * mutating ones) in the router, so req.user is always populated.
 *
 * File uploads are handled upstream by `logoUpload` (multer-storage-cloudinary)
 * — by the time we get here, Cloudinary has already received the file and
 * req.file carries:
 *   - file.path      -> the Cloudinary secure_url (what you store in DB)
 *   - file.filename   -> the Cloudinary public_id (useful for deletion)
 */

// ─── GET /seller ────────────────────────────────────────────────────────────

const getSellerProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.getSellerProfile({ userId: req.user.id });
  res.status(200).json({ success: true, data: profile });
});

// ─── POST /seller ───────────────────────────────────────────────────────────

const createSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, country, commune, quartier, avenue } =
    req.body;

  // logoUpload middleware = multer.single("logo") -> req.file
  const logoUrl = req.file?.path;
  if (!logoUrl) {
    throw errors.badRequest("Le logo de la boutique est requis.");
  }

  const profile = await sellerService.createSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    country,
    commune,
    quartier,
    avenue,
    logoUrl,
  });

  res.status(201).json({ success: true, data: profile });
});

// ─── PATCH /seller ──────────────────────────────────────────────────────────

const updateSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  // Logo is optional on update — only present if the user re-uploaded one
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
