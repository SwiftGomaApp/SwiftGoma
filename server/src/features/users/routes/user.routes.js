const express = require("express");

const userController = require("../controllers/user.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const {
  imageUpload,
  verifyImageContents,
} = require("../../../common/middleware/upload");
const { authorize } = require("../../../common/middleware/authorize");
const {
  otpRequestLimiter,
  otpRequestAccountLimiter,
  otpRequestUserLimiter,
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  credentialGuessUserLimiter,
  authenticatedActionLimiter,
} = require("../../../common/middleware/rateLimiters");

const UserRouter = express.Router();

UserRouter.patch(
  "/profile",
  authenticate,
  authenticatedActionLimiter,
  userController.updateProfile,
);
UserRouter.post(
  "/profile/avatar",
  authenticate,
  imageUpload.single("avatar"),
  verifyImageContents,
  userController.uploadProfilePicture,
);
UserRouter.post(
  "/delete",
  authenticate,
  credentialGuessUserLimiter,
  userController.deleteAccount,
);
UserRouter.post(
  "/recovery/request",
  otpRequestLimiter,
  otpRequestAccountLimiter,
  userController.requestAccountRecovery,
);
UserRouter.post(
  "/recovery/verify",
  credentialGuessLimiter,
  credentialGuessAccountLimiter,
  userController.verifyAccountRecovery,
);
UserRouter.post(
  "/phone/request",
  authenticate,
  otpRequestUserLimiter,
  userController.requestPhoneVerification,
);
UserRouter.post(
  "/phone/verify",
  authenticate,
  credentialGuessUserLimiter,
  userController.verifyPhone,
);
UserRouter.post(
  "/phone/update/request",
  authenticate,
  otpRequestUserLimiter,
  userController.requestPhoneUpdate,
);
UserRouter.post(
  "/phone/update/verify",
  authenticate,
  credentialGuessUserLimiter,
  userController.verifyPhoneUpdate,
);
UserRouter.post(
  "/email/secondary/request",
  authenticate,
  otpRequestUserLimiter,
  userController.requestSecondaryEmail,
);
UserRouter.post(
  "/email/secondary/verify",
  authenticate,
  credentialGuessUserLimiter,
  userController.verifySecondaryEmail,
);

UserRouter.delete(
  "/email/secondary",
  authenticate,
  userController.deleteSecondaryEmail,
);

UserRouter.post("/google/link", authenticate, userController.postLinkGoogle);
UserRouter.post(
  "/google/unlink",
  authenticate,
  userController.postUnlinkGoogle,
);

UserRouter.use(authenticate);

UserRouter.get("/", authorize("ADMIN", "SUPPORT"), userController.getUsers);
UserRouter.get(
  "/:id",
  authorize("ADMIN", "SUPPORT"),
  userController.getUserById,
);

UserRouter.post(
  "/:id/block",
  authorize("ADMIN", "SUPPORT"),
  userController.postBlockUser,
);
UserRouter.post(
  "/:id/unblock",
  authorize("ADMIN", "SUPPORT"),
  userController.postUnblockUser,
);

UserRouter.post(
  "/:id/force-logout",
  authorize("ADMIN", "SUPPORT"),
  userController.postForceLogout,
);

UserRouter.post(
  "/:id/verify-email",
  authorize("ADMIN", "SUPPORT"),
  userController.postVerifyEmail,
);
UserRouter.post(
  "/:id/verify-phone",
  authorize("ADMIN", "SUPPORT"),
  userController.postVerifyPhone,
);

UserRouter.post(
  "/:id/delete",
  authorize("ADMIN"),
  userController.postDeleteUser,
);
UserRouter.post(
  "/:id/restore",
  authorize("ADMIN"),
  userController.postRestoreUser,
);

UserRouter.post("/:id/role", authorize("ADMIN"), userController.postChangeRole);

module.exports = UserRouter;
