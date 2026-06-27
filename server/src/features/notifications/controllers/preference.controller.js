const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const preferencesService = require("../services/preferences.service");

const getPreferences = catchAsync(async (req, res) => {
  const prefs = await preferencesService.getPreferences({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: prefs });
});

const updatePreferences = catchAsync(async (req, res) => {
  const {
    language,
    timezone,
    currency,
    darkMode,
    notifyInApp,
    notifyEmail,
    notifyPush,
    notifySms,
  } = req.body;

  const prefs = await preferencesService.updatePreferences({
    userId: req.user.id,
    language,
    timezone,
    currency,
    darkMode,
    notifyInApp,
    notifyEmail,
    notifyPush,
    notifySms,
  });

  res.status(200).json({
    success: true,
    message: "Préférences mises à jour.",
    data: prefs,
  });
});

const updateNotificationTypeSetting = catchAsync(async (req, res) => {
  const { type } = req.params;
  const { inApp, email, sms, push } = req.body;

  const channels = {};
  if (inApp !== undefined) channels.inApp = inApp;
  if (email !== undefined) channels.email = email;
  if (sms !== undefined) channels.sms = sms;
  if (push !== undefined) channels.push = push;

  if (Object.keys(channels).length === 0) {
    throw errors.badRequest("Aucun canal fourni.");
  }

  const prefs = await preferencesService.updateNotificationTypeSetting({
    userId: req.user.id,
    type: type.toUpperCase(),
    channels,
  });

  res.status(200).json({
    success: true,
    message: `Paramètres de notification pour ${type} mis à jour.`,
    data: prefs,
  });
});

const registerPushToken = catchAsync(async (req, res) => {
  const { token, platform, deviceId } = req.body;
  if (!token) throw errors.badRequest("Le token est requis.");
  if (!platform) throw errors.badRequest("La plateforme est requise.");

  const result = await preferencesService.registerPushToken({
    userId: req.user.id,
    token,
    platform,
    deviceId,
  });

  res.status(201).json({
    success: true,
    message: "Token enregistré.",
    data: result,
  });
});

const removePushToken = catchAsync(async (req, res) => {
  const { token } = req.body;
  if (!token) throw errors.badRequest("Le token est requis.");
  await preferencesService.removePushToken({ userId: req.user.id, token });
  res.status(200).json({ success: true, message: "Token supprimé." });
});

const listPushTokens = catchAsync(async (req, res) => {
  const tokens = await preferencesService.listPushTokens({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: tokens });
});

module.exports = {
  getPreferences,
  updatePreferences,
  updateNotificationTypeSetting,
  registerPushToken,
  removePushToken,
  listPushTokens,
};
