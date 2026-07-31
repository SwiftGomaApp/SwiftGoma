const {
  createNotification,
  listNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreference,
} = require("../services/notification.service");

async function getNotifications(req, res, next) {
  try {
    const result = await listNotifications(req.user.id, req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postMarkAsRead(req, res, next) {
  try {
    const result = await markAsRead(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postMarkAllAsRead(req, res, next) {
  try {
    const result = await markAllAsRead(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function deleteNotificationById(req, res, next) {
  try {
    const result = await deleteNotification(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getNotificationPreferences(req, res, next) {
  try {
    const result = await getPreferences(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function putNotificationPreference(req, res, next) {
  try {
    const result = await updatePreference({
      userId: req.user.id,
      type: req.body.type,
      inApp: req.body.inApp,
      email: req.body.email,
      sms: req.body.sms,
      push: req.body.push,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postCreateNotification(req, res, next) {
  try {
    const result = await createNotification({
      userId: req.body.userId,
      type: req.body.type,
      title: req.body.title,
      body: req.body.body,
      data: req.body.data,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  postMarkAsRead,
  postMarkAllAsRead,
  deleteNotificationById,
  getNotificationPreferences,
  putNotificationPreference,
  postCreateNotification,
};
