const express = require("express");
const {
  authenticate,
  requireVerified,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  listPlans,
  getPlan,
  updatePlan,
  adminListSubscriptions,
  getSubscription,
  subscribe,
  cancelSubscription,
} = require("../controllers/subscription.controller");
const {
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
} = require("../controllers/seller.profile.controller");
const {
  logoUpload,
  kycUploadMiddleware,
  shopLogoUpload,
  productImagesUpload,
} = require("../../../shared/middleware/upload.middleware");
const {
  getKycStatus,
  submitKyc,
  listPendingKyc,
  approveKyc,
  rejectKyc,
} = require("../controllers/kyc.controller");
const {
  getShopBySlug,
  listMyShops,
  getMyShop,
  createShop,
  updateShop,
  closeShop,
  suspendShop,
  unsuspendShop,
} = require("../controllers/shop.controller");
const {
  supportListCategories,
  supportCreateCategory,
  supportUpdateCategory,
  supportDeleteCategory,
  approveCategory,
  rejectCategory,
  listCategories,
  getCategoryBySlug,
  suggestCategory,
} = require("../controllers/category.controller");

const {
  listAllProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  listProducts,
  getProduct,
  addProductImages,
  deleteProductImage,
  setPrimaryImage,
  createVariant,
  updateVariant,
  deleteVariant,
  toggleFeatured,
} = require("../controllers/product.controller");

const router = express.Router();

// ─── Plans (public) ───────────────────────────────────────────────────────────

router.get("/plans", listPlans);
router.get("/plans/:tier", getPlan);

router.get("/categories", listCategories);
router.get("/categories/:slug", getCategoryBySlug);

// ─── Categories (seller) ──────────────────────────────────────────────────────

router.post(
  "/categories/suggest",
  authenticate,
  requireVerified,
  suggestCategory,
);

// ─── Subscription ─────────────────────────────────────────────────────────────

router.get("/subscription", authenticate, requireVerified, getSubscription);
router.post("/subscription", authenticate, requireVerified, subscribe);
router.delete(
  "/subscription",
  authenticate,
  requireVerified,
  cancelSubscription,
);

// ─── Seller profile ───────────────────────────────────────────────────────────

router.get("/profile", authenticate, requireVerified, getSellerProfile);
router.post(
  "/profile",
  authenticate,
  requireVerified,
  logoUpload,
  createSellerProfile,
);
router.patch(
  "/profile",
  authenticate,
  requireVerified,
  logoUpload,
  updateSellerProfile,
);

// ─── KYC ─────────────────────────────────────────────────────────────────────

router.get("/kyc", authenticate, requireVerified, getKycStatus);
router.post(
  "/kyc",
  authenticate,
  requireVerified,
  kycUploadMiddleware,
  submitKyc,
);

// ─── Shops (public) ───────────────────────────────────────────────────────────

router.get("/shops/slug/:slug", getShopBySlug);

// ─── Shops (seller) ───────────────────────────────────────────────────────────

router.get("/shops", authenticate, requireVerified, listMyShops);
router.get("/shops/:id", authenticate, requireVerified, getMyShop);
router.post("/shops", authenticate, requireVerified, createShop);
router.patch(
  "/shops/:id",
  authenticate,
  requireVerified,
  shopLogoUpload,
  updateShop,
);
router.delete("/shops/:id", authenticate, requireVerified, closeShop);

// ─── Products ─────────────────────────────────────────────────────────────────

// Public — buyers see active products only

router.get("/products", listAllProducts);

router.get(
  "/shops/:shopId/products",
  (req, res, next) => {
    req.query.status = "ACTIVE";
    next();
  },
  listProducts,
);
router.get("/shops/:shopId/products/:id", getProduct);

// Seller — sees all statuses
router.get(
  "/my/shops/:shopId/products",
  authenticate,
  requireVerified,
  listProducts,
);
router.post(
  "/my/shops/:shopId/products",
  authenticate,
  requireVerified,
  createProduct,
);
router.patch(
  "/my/shops/:shopId/products/:id",
  authenticate,
  requireVerified,
  updateProduct,
);
router.delete(
  "/my/shops/:shopId/products/:id",
  authenticate,
  requireVerified,
  archiveProduct,
);
router.patch(
  "/my/shops/:shopId/products/:id/feature",
  authenticate,
  requireVerified,
  toggleFeatured,
);

// Images
router.post(
  "/my/shops/:shopId/products/:id/images",
  authenticate,
  requireVerified,
  productImagesUpload,
  addProductImages,
);
router.delete(
  "/my/shops/:shopId/products/:id/images/:imageId",
  authenticate,
  requireVerified,
  deleteProductImage,
);
router.patch(
  "/my/shops/:shopId/products/:id/images/:imageId/primary",
  authenticate,
  requireVerified,
  setPrimaryImage,
);

// Variants
router.post(
  "/my/shops/:shopId/products/:id/variants",
  authenticate,
  requireVerified,
  createVariant,
);
router.patch(
  "/my/shops/:shopId/products/:id/variants/:variantId",
  authenticate,
  requireVerified,
  updateVariant,
);
router.delete(
  "/my/shops/:shopId/products/:id/variants/:variantId",
  authenticate,
  requireVerified,
  deleteVariant,
);

// ─── Support ──────────────────────────────────────────────────────────────────

router.get(
  "/support/kyc",
  authenticate,
  requireRole("SUPPORT"),
  listPendingKyc,
);
router.patch(
  "/support/kyc/:id/approve",
  authenticate,
  requireRole("SUPPORT"),
  approveKyc,
);
router.patch(
  "/support/kyc/:id/reject",
  authenticate,
  requireRole("SUPPORT"),
  rejectKyc,
);
router.patch(
  "/support/shops/:id/suspend",
  authenticate,
  requireRole("SUPPORT"),
  suspendShop,
);
router.patch(
  "/support/shops/:id/unsuspend",
  authenticate,
  requireRole("SUPPORT"),
  unsuspendShop,
);

router.get(
  "/support/categories",
  authenticate,
  requireRole("SUPPORT"),
  supportListCategories,
);
router.post(
  "/support/categories",
  authenticate,
  requireRole("SUPPORT"),
  supportCreateCategory,
);
router.patch(
  "/support/categories/:id",
  authenticate,
  requireRole("SUPPORT"),
  supportUpdateCategory,
);
router.delete(
  "/support/categories/:id",
  authenticate,
  requireRole("SUPPORT"),
  supportDeleteCategory,
);
router.patch(
  "/support/categories/:id/approve",
  authenticate,
  requireRole("SUPPORT"),
  approveCategory,
);
router.patch(
  "/support/categories/:id/reject",
  authenticate,
  requireRole("SUPPORT"),
  rejectCategory,
);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.patch(
  "/admin/plans/:tier",
  authenticate,
  requireRole("ADMIN"),
  updatePlan,
);
router.get(
  "/admin/subscriptions",
  authenticate,
  requireRole("ADMIN"),
  adminListSubscriptions,
);

module.exports = { sellerRouter: router };
