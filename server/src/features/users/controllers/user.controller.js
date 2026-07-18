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

async function postLinkGoogle(req, res, next) {
  try {
    const result = await userService.linkGoogleAccount(
      req.user.id,
      req.body.idToken,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postUnlinkGoogle(req, res, next) {
  try {
    const result = await userService.unlinkGoogleAccount(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await userService.listUsers(req.query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const result = await userService.getUserDetail(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postBlockUser(req, res, next) {
  try {
    const result = await userService.blockUser(
      req.user,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postUnblockUser(req, res, next) {
  try {
    const result = await userService.unblockUser(
      req.user,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postForceLogout(req, res, next) {
  try {
    const result = await userService.forceLogout(
      req.user,
      req.params.id,
      req.body.sessionId,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postVerifyEmail(req, res, next) {
  try {
    const result = await verifyUserEmail(
      req.user,
      req.params.id,
      req.body.emailId,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postVerifyPhone(req, res, next) {
  try {
    const result = await userService.verifyUserPhone(req.user, req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postDeleteUser(req, res, next) {
  try {
    const result = await userService.adminDeleteUser(
      req.user,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postRestoreUser(req, res, next) {
  try {
    const result = await userService.adminRestoreUser(
      req.user,
      req.params.id,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postChangeRole(req, res, next) {
  try {
    const result = await changeUserRole(
      req.user,
      req.params.id,
      req.body.role,
      req.body.reason,
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
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
  postLinkGoogle,
  postUnlinkGoogle,
  getUsers,
  getUserById,
  postBlockUser,
  postUnblockUser,
  postForceLogout,
  postVerifyEmail,
  postVerifyPhone,
  postDeleteUser,
  postRestoreUser,
  postChangeRole,
};
