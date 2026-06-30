const express = require("express");
const {
  authenticate,
} = require("../../auth/middlewares/authenticate.middleware");
const {
  getPreferences,
  updatePreferences,
  updateNotificationTypeSetting,
  listPushTokens,
  registerPushToken,
  removePushToken,
} = require("../controllers/preference.controller");
const {
  listNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  deleteAllNotifications,
  deleteNotification,
} = require("../controllers/notification.controller");

const router = express.Router();

router.use(authenticate);

// ─── Preferences ─────────────────────────────────────────────────────────────

router.get("/preferences", getPreferences);
router.patch("/preferences", updatePreferences);

router.patch("/preferences/notifications/:type", updateNotificationTypeSetting);

// ─── Push tokens ──────────────────────────────────────────────────────────────

router.get("/push-tokens", listPushTokens);
router.post("/push-tokens", registerPushToken);
router.delete("/push-tokens", removePushToken);

// ─── Notifications ────────────────────────────────────────────────────────────

router.get("/notifications", listNotifications);
router.get("/notifications/unread-count", getUnreadCount);
router.patch("/notifications/read-all", markAllAsRead);
router.patch("/notifications/:id/read", markAsRead);
router.delete("/notifications", deleteAllNotifications);
router.delete("/notifications/:id", deleteNotification);

module.exports = { notificationRouter: router };
