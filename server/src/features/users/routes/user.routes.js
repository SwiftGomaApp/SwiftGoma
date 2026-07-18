const express = require("express");

const userController = require("../controllers/user.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { imageUpload } = require("../../../common/middleware/upload");

const UserRouter = express.Router();

UserRouter.patch("/profile", authenticate, userController.updateProfile);
UserRouter.post(
  "/profile/avatar",
  authenticate,
  imageUpload.single("avatar"),
  userController.uploadProfilePicture,
);
UserRouter.post("/delete", authenticate, userController.deleteAccount);
UserRouter.post("/recovery/request", userController.requestAccountRecovery);
UserRouter.post("/recovery/verify", userController.verifyAccountRecovery);
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

module.exports = UserRouter;
