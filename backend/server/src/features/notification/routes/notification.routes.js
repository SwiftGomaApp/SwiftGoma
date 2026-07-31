const express = require("express");
const {
  getNotifications,
  postMarkAsRead,
  postMarkAllAsRead,
  deleteNotificationById,
  getNotificationPreferences,
  putNotificationPreference,
  postCreateNotification,
} = require("../controllers/notification.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const {
  requireRole,
  authorize,
} = require("../../../common/middleware/authorize");

const NotificationRouter = express.Router();

NotificationRouter.use(authenticate);

NotificationRouter.get("/", getNotifications);
NotificationRouter.post("/:id/read", postMarkAsRead);
NotificationRouter.post("/read-all", postMarkAllAsRead);
NotificationRouter.delete("/:id", deleteNotificationById);

NotificationRouter.get("/preferences", getNotificationPreferences);
NotificationRouter.put("/preferences", putNotificationPreference);

NotificationRouter.post(
  "/",
  authorize("ADMIN", "SUPPORT"),
  postCreateNotification,
);

module.exports = NotificationRouter;
