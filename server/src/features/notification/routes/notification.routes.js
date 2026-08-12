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
NotificationRouter.post("/read-all", postMarkAllAsRead);
NotificationRouter.get("/preferences", getNotificationPreferences);
NotificationRouter.put("/preferences", putNotificationPreference);
NotificationRouter.post(
  "/",
  authorize("ADMIN", "SUPPORT"),
  postCreateNotification,
);
NotificationRouter.post("/:id/read", postMarkAsRead);
NotificationRouter.delete("/:id", deleteNotificationById);

module.exports = NotificationRouter;
