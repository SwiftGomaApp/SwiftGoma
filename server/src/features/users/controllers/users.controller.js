const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const preferencesService = require("../services/preference.service");
const sellerService = require("../services/seller.service");
const delivererService = require("../services/delivery.service");
const adminUsersService = require("../services/admin.user.service");

const getPreferences = catchAsync(async (req, res) => {
  const prefs = await preferencesService.getPreferences({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: prefs });
});

const updatePreferences = catchAsync(async (req, res) => {
  const {
    language,
    timezone,
    currency,
    darkMode,
    notifyEmail,
    notifySms,
    notifyPush,
    notifyInApp,
  } = req.body;

  const prefs = await preferencesService.updatePreferences({
    userId: req.user.id,
    language,
    timezone,
    currency,
    darkMode,
    notifyEmail,
    notifySms,
    notifyPush,
    notifyInApp,
  });

  res.status(200).json({
    success: true,
    message: "Préférences mises à jour.",
    data: prefs,
  });
});

// ─── Seller ───────────────────────────────────────────────────────────────────

const getSellerProfile = catchAsync(async (req, res) => {
  const profile = await sellerService.getSellerProfile({ userId: req.user.id });
  res.status(200).json({ success: true, data: profile });
});

const createSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const profile = await sellerService.createSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl: req.file?.path ?? null,
  });

  res.status(201).json({
    success: true,
    message:
      "Profil vendeur créé. Soumettez vos documents KYC pour commencer à vendre.",
    data: profile,
  });
});

const updateSellerProfile = catchAsync(async (req, res) => {
  const { shopName, description, commune, quartier, avenue } = req.body;

  const profile = await sellerService.updateSellerProfile({
    userId: req.user.id,
    shopName,
    description,
    commune,
    quartier,
    avenue,
    logoUrl: req.file?.path ?? null,
  });

  res.status(200).json({
    success: true,
    message: "Profil vendeur mis à jour.",
    data: profile,
  });
});

const submitKyc = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw errors.badRequest("Au moins un document KYC est requis.");
  }

  const documentUrls = req.files.map((f) => f.path);

  const profile = await sellerService.submitKyc({
    userId: req.user.id,
    documentUrls,
  });

  res.status(200).json({
    success: true,
    message:
      "Documents KYC soumis. Votre profil sera examiné dans les 48 heures.",
    data: profile,
  });
});

// ─── Deliverer ────────────────────────────────────────────────────────────────

const getDelivererProfile = catchAsync(async (req, res) => {
  const profile = await delivererService.getDelivererProfile({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: profile });
});

const createDelivererProfile = catchAsync(async (req, res) => {
  const { sellerProfileId, zone, vehicleType } = req.body;

  if (!sellerProfileId) {
    throw errors.badRequest("L'identifiant de la boutique est requis.");
  }

  const profile = await delivererService.createDelivererProfile({
    userId: req.user.id,
    sellerProfileId,
    zone,
    vehicleType,
  });

  res.status(201).json({
    success: true,
    message: "Profil livreur créé.",
    data: profile,
  });
});

const updateDelivererProfile = catchAsync(async (req, res) => {
  const { zone, vehicleType, isAvailable } = req.body;

  const profile = await delivererService.updateDelivererProfile({
    userId: req.user.id,
    zone,
    vehicleType,
    isAvailable,
  });

  res.status(200).json({
    success: true,
    message: "Profil livreur mis à jour.",
    data: profile,
  });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

const listUsers = catchAsync(async (req, res) => {
  const { page, limit, search, role, isBlocked, isVerified } = req.query;

  const result = await adminUsersService.listUsers({
    page: page ? parseInt(page) : 1,
    limit: limit ? Math.min(parseInt(limit), 100) : 20,
    search,
    role,
    isBlocked: isBlocked !== undefined ? isBlocked === "true" : undefined,
    isVerified: isVerified !== undefined ? isVerified === "true" : undefined,
  });

  res.status(200).json({ success: true, data: result });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await adminUsersService.getUserById({ userId: req.params.id });
  res.status(200).json({ success: true, data: user });
});

const blockUser = catchAsync(async (req, res) => {
  await adminUsersService.blockUser({
    userId: req.params.id,
    adminId: req.user.id,
  });
  res.status(200).json({ success: true, message: "Utilisateur bloqué." });
});

const unblockUser = catchAsync(async (req, res) => {
  await adminUsersService.unblockUser({ userId: req.params.id });
  res.status(200).json({ success: true, message: "Utilisateur débloqué." });
});

const verifyUser = catchAsync(async (req, res) => {
  await adminUsersService.verifyUser({ userId: req.params.id });
  res.status(200).json({ success: true, message: "Utilisateur vérifié." });
});

const changeUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;

  const user = await adminUsersService.changeUserRole({
    userId: req.params.id,
    role,
    adminId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Rôle mis à jour : ${role}.`,
    data: user,
  });
});

const reviewKyc = catchAsync(async (req, res) => {
  const { decision, note } = req.body;

  const profile = await adminUsersService.reviewKyc({
    sellerProfileId: req.params.sellerProfileId,
    decision,
    note,
    adminId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `KYC ${decision === "APPROVED" ? "approuvé" : "rejeté"}.`,
    data: profile,
  });
});

module.exports = {
  getPreferences,
  updatePreferences,
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
  submitKyc,
  getDelivererProfile,
  createDelivererProfile,
  updateDelivererProfile,
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  verifyUser,
  changeUserRole,
  reviewKyc,
};
