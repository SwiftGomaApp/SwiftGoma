const userService = require("../services/user.service");
const { ValidationError } = require("../../../common/errors");
const {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} = require("../../auth/utils/cookies");

async function updateProfile(req, res) {
  const { name, avatarUrl } = req.body;
  const user = await userService.updateProfile({
    userId: req.user.id,
    name,
    avatarUrl,
  });
  res.status(200).json({ success: true, data: user });
}

async function deleteAccount(req, res) {
  const { reason, locale } = req.body;
  const result = await userService.deleteAccount({
    userId: req.user.id,
    reason,
    locale,
  });
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
  res.status(200).json({ success: true, data: result });
}

async function requestAccountRecovery(req, res) {
  const { email, locale } = req.body;
  const result = await userService.requestAccountRecovery({ email, locale });
  res.status(200).json({ success: true, data: result });
}

async function verifyAccountRecovery(req, res) {
  const { email, code, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const result = await userService.verifyAccountRecovery({
    email,
    code,
    userAgent,
    ipAddress,
    deviceName,
    locale,
  });

  if (result.requiresTotp) {
    return res.status(200).json({
      success: true,
      data: { requiresTotp: true, userId: result.userId },
    });
  }

  const { user, accessToken, refreshToken } = result;

  if (isMobile) {
    return res
      .status(200)
      .json({ success: true, data: { user, accessToken, refreshToken } });
  }

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user } });
}

async function requestPhoneVerification(req, res) {
  const { phone } = req.body;
  const result = await userService.requestPhoneVerification({
    userId: req.user.id,
    phone,
  });
  res.status(200).json({ success: true, data: result });
}

async function verifyPhone(req, res) {
  const { code, locale } = req.body;
  const user = await userService.verifyPhone({
    userId: req.user.id,
    code,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}

async function uploadProfilePicture(req, res) {
  if (!req.file) {
    throw new ValidationError("No image file provided.");
  }
  const user = await userService.uploadProfilePicture({
    userId: req.user.id,
    buffer: req.file.buffer,
  });
  res.status(200).json({ success: true, data: user });
}

async function requestPhoneUpdate(req, res) {
  const { newPhone } = req.body;
  const result = await userService.requestPhoneUpdate({
    userId: req.user.id,
    newPhone,
  });
  res.status(200).json({ success: true, data: result });
}

async function verifyPhoneUpdate(req, res) {
  const { code, locale } = req.body;
  const user = await userService.verifyPhoneUpdate({
    userId: req.user.id,
    code,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}
async function requestSecondaryEmail(req, res) {
  const { email, locale } = req.body;
  const result = await userService.requestSecondaryEmail({
    userId: req.user.id,
    email,
    locale,
  });
  res.status(200).json({ success: true, data: result });
}

async function verifySecondaryEmail(req, res) {
  const { code, locale } = req.body;
  const user = await userService.verifySecondaryEmail({
    userId: req.user.id,
    code,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}

module.exports = {
  updateProfile,
  deleteAccount,
  requestAccountRecovery,
  verifyAccountRecovery,
  requestPhoneVerification,
  verifyPhone,
  uploadProfilePicture,
  requestPhoneUpdate,
  verifyPhoneUpdate,
  requestSecondaryEmail,
  verifySecondaryEmail,
};
