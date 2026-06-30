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

// ─── Seller onboarding ───────────────────────────────────────────────────────

router.get("/seller", requireVerified, getSellerProfile);
router.post("/seller", requireVerified, logoUpload, createSellerProfile);
router.patch("/seller", requireVerified, logoUpload, updateSellerProfile);
router.post("/seller/kyc", requireVerified, kycUploadMiddleware, submitKyc);

// ─── Deliverer onboarding ─────────────────────────────────────────────────────

router.get("/deliverer", requireVerified, getDelivererProfile);
router.post("/deliverer", requireVerified, createDelivererProfile);
router.patch("/deliverer", requireVerified, updateDelivererProfile);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get("/admin/users", requireRole("ADMIN"), listUsers);
router.get("/admin/users/:id", requireRole("ADMIN"), getUserById);
router.patch("/admin/users/:id/block", requireRole("ADMIN"), blockUser);
router.patch("/admin/users/:id/unblock", requireRole("ADMIN"), unblockUser);
router.patch("/admin/users/:id/verify", requireRole("ADMIN"), verifyUser);
router.patch("/admin/users/:id/role", requireRole("ADMIN"), changeUserRole);
router.patch("/admin/kyc/:sellerProfileId", requireRole("ADMIN"), reviewKyc);

module.exports = { usersRouter: router };
