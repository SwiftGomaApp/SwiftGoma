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
  getShopsHandler,
} = require("../controllers/shop.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const {
  imageUpload,
  documentUpload,
  verifyImageContents,
  verifyDocumentContents,
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

SellerRouter.get("/shop/slug/:slug", getShopBySlugHandler);
SellerRouter.get("/shops", getShopsHandler);

SellerRouter.use(authenticate);

// ----- Seller Profile -----
SellerRouter.post(
  "/",
  authorize("SELLER"),
  sellerProfileImages,
  verifyImageContents,
  postCreateSellerProfile,
);
SellerRouter.get("/my-profile", authorize("SELLER"), getMySellerProfile);
SellerRouter.put(
  "/",
  authorize("SELLER"),
  sellerProfileImages,
  verifyImageContents,
  putSellerProfile,
);

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
SellerRouter.post(
  "/kyc",
  authorize("SELLER"),
  kycFiles,
  verifyDocumentContents,
  postSubmitKyc,
);
SellerRouter.get("/kyc/my-kyc", authorize("SELLER"), getMyKyc);
SellerRouter.post(
  "/kyc/resubmit",
  authorize("SELLER"),
  kycFiles,
  verifyDocumentContents,
  postResubmitKyc,
);

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
SellerRouter.post(
  "/shop",
  authorize("SELLER"),
  shopImages,
  verifyImageContents,
  postCreateShop,
);
SellerRouter.get("/shop/me", authorize("SELLER"), getMyShops);
SellerRouter.put(
  "/shop/:id",
  authorize("SELLER"),
  shopImages,
  verifyImageContents,
  putUpdateShop,
);
SellerRouter.post("/shop/:id/publish", authorize("SELLER"), postPublishShop);
SellerRouter.post(
  "/shop/:id/unpublish",
  authorize("SELLER"),
  postUnpublishShop,
);
SellerRouter.post("/shop/:id/suspend", authorize("SELLER"), postSuspendMyShop);
SellerRouter.post(
  "/shop/:id/reactivate",
  authorize("SELLER"),
  postReactivateMyShop,
);
SellerRouter.delete("/shop/:id", authorize("SELLER"), deleteMyShop);

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
