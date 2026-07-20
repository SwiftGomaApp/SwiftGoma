function buildNotificationPayload(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

module.exports = { buildNotificationPayload };
