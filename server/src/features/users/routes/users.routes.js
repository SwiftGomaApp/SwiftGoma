const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  avatarUpload,
  logoUpload,
  kycUploadMiddleware,
} = require("../../../shared/middleware/upload.middleware");
const {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,
  requestRecoverAccount,
  recoverAccount,
} = require("../controllers/profile.controller");
const {
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");
const {
  getPreferences,
  updatePreferences,
  listUsers,
  getUserById,
  blockUser,
  unblockUser,
  verifyUser,
  changeUserRole,
} = require("../controllers/users.controller");

const router = express.Router();

router.post("/account/recover/request", requestRecoverAccount);
router.post("/account/recover", recoverAccount);

router.use(authenticate);

// ─── Profile ─────────────────────────────────────────────────────────────────

router.get("/me", getProfile);
router.patch("/me", requireVerified, updateProfile);
router.post("/me/avatar", requireVerified, avatarUpload, updateAvatar);
router.delete("/account", deleteAccount);

// ─── Addresses ───────────────────────────────────────────────────────────────

router.get("/addresses", requireVerified, listAddresses);
router.post("/addresses", requireVerified, addAddress);
router.patch("/addresses/:id", requireVerified, updateAddress);
router.delete("/addresses/:id", requireVerified, deleteAddress);
router.patch("/addresses/:id/default", requireVerified, setDefaultAddress);

// ─── Preferences ─────────────────────────────────────────────────────────────

router.get("/preferences", getPreferences);
router.patch("/preferences", updatePreferences);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get("/admin/users", requireRole("ADMIN", "SUPPORT"), listUsers);
router.get("/admin/users/:id", requireRole("ADMIN", "SUPPORT"), getUserById);
router.patch(
  "/admin/users/:id/block",
  requireRole("ADMIN", "SUPPORT"),
  blockUser,
);
router.patch(
  "/admin/users/:id/unblock",
  requireRole("ADMIN", "SUPPORT"),
  unblockUser,
);
router.patch(
  "/admin/users/:id/verify",
  requireRole("ADMIN", "SUPPORT"),
  verifyUser,
);
router.patch(
  "/admin/users/:id/role",
  requireRole("ADMIN", "SUPPORT"),
  changeUserRole,
);

module.exports = { usersRouter: router };
