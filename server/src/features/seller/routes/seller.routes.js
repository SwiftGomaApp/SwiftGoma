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
const kycFiles = documentUpload.fields([
  { name: "idDocument", maxCount: 1 },
  { name: "proofOfAddress", maxCount: 1 },
  { name: "rccmDocument", maxCount: 1 },
]);

SellerRouter.use(authenticate);

SellerRouter.post("/", sellerProfileImages, postCreateSellerProfile);
SellerRouter.get("/my-profile", getMySellerProfile);
SellerRouter.put("/", sellerProfileImages, putSellerProfile);

SellerRouter.post("/kyc", kycFiles, postSubmitKyc);
SellerRouter.get("/kyc/my-kyc", getMyKyc);
SellerRouter.post("/kyc/resubmit", kycFiles, postResubmitKyc);

SellerRouter.get("/kyc/", authorize("ADMIN", "SUPPORT"), getKycList);
SellerRouter.get("/kyc/:id", authorize("ADMIN", "SUPPORT"), getKycDetail);
SellerRouter.post(
  "/kyc/:id/reject",
  authorize("ADMIN", "SUPPORT"),
  postRejectKyc,
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

SellerRouter.post(
  "/kyc/:id/support-review",
  authorize("SUPPORT"),
  postSupportReview,
);

// Admin only
SellerRouter.post("/kyc/:id/approve", authorize("ADMIN"), postAdminApprove);

module.exports = SellerRouter;
