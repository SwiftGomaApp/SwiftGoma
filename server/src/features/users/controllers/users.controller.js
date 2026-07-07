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

module.exports = {
  getPreferences,
  updatePreferences,
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  verifyUser,
  changeUserRole,
};
