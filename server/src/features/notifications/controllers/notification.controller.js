const { catchAsync } = require("../../../shared/utils/catchAsync");
const notificationService = require("../services/notification.service");

const listNotifications = catchAsync(async (req, res) => {
  const { page, limit, unreadOnly, type } = req.query;
  const result = await notificationService.listNotifications({
    userId: req.user.id,
    page: page ? parseInt(page) : 1,
    limit: limit ? Math.min(parseInt(limit), 50) : 20,
    unreadOnly: unreadOnly === "true",
    type,
  });
  res.status(200).json({ success: true, data: result });
});

const getUnreadCount = catchAsync(async (req, res) => {
  const result = await notificationService.getUnreadCount({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: result });
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead({
    userId: req.user.id,
    notificationId: req.params.id,
  });
  res.status(200).json({
    success: true,
    message: "Notification marquée comme lue.",
    data: notification,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const result = await notificationService.markAllAsRead({
    userId: req.user.id,
  });
  res.status(200).json({
    success: true,
    message: `${result.updated} notification(s) marquée(s) comme lue(s).`,
    data: result,
  });
});

const deleteNotification = catchAsync(async (req, res) => {
  await notificationService.deleteNotification({
    userId: req.user.id,
    notificationId: req.params.id,
  });
  res.status(200).json({ success: true, message: "Notification supprimée." });
});

const deleteAllNotifications = catchAsync(async (req, res) => {
  const result = await notificationService.deleteAllNotifications({
    userId: req.user.id,
  });
  res.status(200).json({
    success: true,
    message: `${result.deleted} notification(s) supprimée(s).`,
    data: result,
  });
});

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
