const express = require("express");
const {
  postCreateSellerProfile,
  getMySellerProfile,
  putSellerProfile,
  postSuspendSellerProfile,
  postReactivateSellerProfile,
} = require("../controllers/sellerProfile.controller");
const {
  postSubmitKyc,
  getMyKyc,
  postResubmitKyc,
  getKycList,
  getKycDetail,
  postSupportReview,
  postAdminApprove,
  postRejectKyc,
} = require("../controllers/sellerKyc.controller");
const {
  postCreateShop,
  getMyShops,
  putUpdateShop,
  postPublishShop,
  postUnpublishShop,
  postSuspendMyShop,
  postReactivateMyShop,
  deleteMyShop,
  getShopBySlugHandler,
  postSuspendShop,
  postReactivateShop,
  postAdminDeleteShop,
  postRestoreShop,
} = require("../controllers/shop.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  imageUpload,
  documentUpload,
} = require("../../../common/middleware/upload");

const SellerRouter = express.Router();

const sellerProfileImages = imageUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);
const shopImages = imageUpload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);
const kycFiles = documentUpload.fields([
  { name: "idDocument", maxCount: 1 },
  { name: "proofOfAddress", maxCount: 1 },
  { name: "rccmDocument", maxCount: 1 },
]);

// -----------------------------
// PUBLIC — pas d'auth
// -----------------------------
SellerRouter.get("/shop/slug/:slug", getShopBySlugHandler);

// -----------------------------
// À partir d'ici, authentification requise
// -----------------------------
SellerRouter.use(authenticate);

// ----- Seller Profile -----
SellerRouter.post("/", sellerProfileImages, postCreateSellerProfile);
SellerRouter.get("/my-profile", getMySellerProfile);
SellerRouter.put("/", sellerProfileImages, putSellerProfile);

SellerRouter.post(
  "/:userId/suspend",
  authorize("ADMIN", "SUPPORT"),
  postSuspendSellerProfile,
);
SellerRouter.post(
  "/:userId/reactivate",
  authorize("ADMIN", "SUPPORT"),
  postReactivateSellerProfile,
);

// ----- KYC -----
SellerRouter.post("/kyc", kycFiles, postSubmitKyc);
SellerRouter.get("/kyc/my-kyc", getMyKyc);
SellerRouter.post("/kyc/resubmit", kycFiles, postResubmitKyc);

SellerRouter.get("/kyc", authorize("ADMIN", "SUPPORT"), getKycList);
SellerRouter.get("/kyc/:id", authorize("ADMIN", "SUPPORT"), getKycDetail);
SellerRouter.post(
  "/kyc/:id/support-review",
  authorize("SUPPORT", "ADMIN"),
  postSupportReview,
);
SellerRouter.post(
  "/kyc/:id/reject",
  authorize("ADMIN", "SUPPORT"),
  postRejectKyc,
);
SellerRouter.post("/kyc/:id/approve", authorize("ADMIN"), postAdminApprove);

// ----- Shop (vendeur) -----
SellerRouter.post("/shop", shopImages, postCreateShop);
SellerRouter.get("/shop/me", getMyShops);
SellerRouter.put("/shop/:id", shopImages, putUpdateShop);
SellerRouter.post("/shop/:id/publish", postPublishShop);
SellerRouter.post("/shop/:id/unpublish", postUnpublishShop);
SellerRouter.post("/shop/:id/suspend", postSuspendMyShop);
SellerRouter.post("/shop/:id/reactivate", postReactivateMyShop);
SellerRouter.delete("/shop/:id", deleteMyShop);

// ----- Shop (admin) -----
SellerRouter.post(
  "/shop/:id/admin/suspend",
  authorize("ADMIN", "SUPPORT"),
  postSuspendShop,
);
SellerRouter.post(
  "/shop/:id/admin/reactivate",
  authorize("ADMIN", "SUPPORT"),
  postReactivateShop,
);
SellerRouter.delete(
  "/shop/:id/admin",
  authorize("ADMIN", "SUPPORT"),
  postAdminDeleteShop,
);
SellerRouter.post(
  "/shop/:id/restore",
  authorize("ADMIN", "SUPPORT"),
  postRestoreShop,
);

module.exports = SellerRouter;
