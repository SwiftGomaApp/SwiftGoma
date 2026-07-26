const express = require("express");

const userController = require("../controllers/user.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { imageUpload } = require("../../../common/middleware/upload");
const { authorize } = require("../../../common/middleware/authorize");
const { authLimiter } = require("../../../common/middleware/rateLimiters");

const UserRouter = express.Router();

UserRouter.patch("/profile", authenticate, userController.updateProfile);
UserRouter.post(
  "/profile/avatar",
  authenticate,
  imageUpload.single("avatar"),
  userController.uploadProfilePicture,
);
UserRouter.post("/delete", authenticate, userController.deleteAccount);
UserRouter.post(
  "/recovery/request",
  authLimiter,
  userController.requestAccountRecovery,
);
UserRouter.post(
  "/recovery/verify",
  authLimiter,
  userController.verifyAccountRecovery,
);
UserRouter.post(
  "/phone/request",
  authenticate,
  userController.requestPhoneVerification,
);
UserRouter.post("/phone/verify", authenticate, userController.verifyPhone);
UserRouter.post(
  "/phone/update/request",
  authenticate,
  userController.requestPhoneUpdate,
);
UserRouter.post(
  "/phone/update/verify",
  authenticate,
  userController.verifyPhoneUpdate,
);
UserRouter.post(
  "/email/secondary/request",
  authenticate,
  userController.requestSecondaryEmail,
);
UserRouter.post(
  "/email/secondary/verify",
  authenticate,
  userController.verifySecondaryEmail,
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
