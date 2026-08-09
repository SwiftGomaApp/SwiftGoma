const authService = require("../services/auth.service");
const {
  setRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setAccessTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/cookies");

async function createAccount(req, res) {
  const { name, email, locale, role } = req.body;
  const user = await authService.createAccount({ name, email, locale, role });
  res.status(201).json({ success: true, data: user });
}

async function verifyEmail(req, res) {
  const { email, code } = req.body;
  const user = await authService.verifyEmail({ email, code });
  res.status(200).json({ success: true, data: user });
}

async function resendEmailVerification(req, res) {
  const { email, locale } = req.body;
  const user = await authService.resendEmailVerification({ email, locale });
  res.status(200).json({ success: true, data: user });
}

async function requestLoginOtp(req, res) {
  const { email, locale } = req.body;
  const result = await authService.requestLoginOtp({ email, locale });
  res.status(200).json({ success: true, data: result });
}

async function verifyLoginOtp(req, res) {
  const { email, code, deviceName } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const { user, accessToken, refreshToken } = await authService.verifyLoginOtp({
    email,
    code,
    userAgent,
    ipAddress,
    deviceName,
  });

  if (isMobile) {
    return res
      .status(200)
      .json({ success: true, data: { user, accessToken, refreshToken } });
  }

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user } });
}

async function loginWithPassword(req, res) {
  const { email, password, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const result = await authService.loginWithPassword({
    email,
    password,
    userAgent,
    ipAddress,
    deviceName,
    locale,
  });

  if (result.requiresTotp) {
    return res.status(200).json({
      success: true,
      data: { requiresTotp: true, pendingToken: result.pendingToken },
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

async function refreshAccessToken(req, res) {
  const isMobile = req.headers["x-client-type"] === "mobile";
  const refreshToken = isMobile
    ? req.body.refreshToken
    : getRefreshTokenFromRequest(req);

  const result = await authService.refreshAccessToken({ refreshToken });

  if (isMobile) {
    return res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }

  setAccessTokenCookie(res, result.accessToken);
  setRefreshTokenCookie(res, result.refreshToken);
  res.status(200).json({ success: true, data: { user: result.user } });
}

async function getMe(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ success: true, data: user });
}

async function logout(req, res) {
  const result = await authService.logout(req.user.sessionId);
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
  res.status(200).json({ success: true, data: result });
}

async function logoutAll(req, res) {
  const result = await authService.logoutAll(req.user.id);
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
  res.status(200).json({ success: true, data: result });
}

async function listSessions(req, res) {
  const sessions = await authService.listSessions({
    userId: req.user.id,
    currentSessionId: req.user.sessionId,
  });
  res.status(200).json({ success: true, data: sessions });
}

async function revokeSession(req, res) {
  const { sessionId } = req.params;
  const result = await authService.revokeSession({
    userId: req.user.id,
    sessionId,
  });
  res.status(200).json({ success: true, data: result });
}

async function createPassword(req, res) {
  const { password, locale } = req.body;
  const user = await authService.createPassword({
    userId: req.user.id,
    password,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword, locale } = req.body;
  const user = await authService.updatePassword({
    userId: req.user.id,
    currentSessionId: req.user.sessionId,
    currentPassword,
    newPassword,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}

async function forgotPassword(req, res) {
  const { email, locale } = req.body;
  const result = await authService.forgotPassword({ email, locale });
  res.status(200).json({ success: true, data: result });
}

async function resetPassword(req, res) {
  const { email, code, newPassword, locale } = req.body;
  const user = await authService.resetPassword({
    email,
    code,
    newPassword,
    locale,
  });
  res.status(200).json({ success: true, data: user });
}

async function setupTotp(req, res) {
  const result = await authService.setupTotp({ userId: req.user.id });
  res.status(200).json({ success: true, data: result });
}

async function confirmTotp(req, res) {
  const { code } = req.body;
  const result = await authService.confirmTotp({ userId: req.user.id, code });
  res.status(200).json({ success: true, data: result });
}

async function disableTotp(req, res) {
  const { code, locale } = req.body;
  const result = await authService.disableTotp({
    userId: req.user.id,
    code,
    locale,
  });
  res.status(200).json({ success: true, data: result });
}

async function loginWithTotp(req, res) {
  const { pendingToken, code, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const { user, accessToken, refreshToken } = await authService.loginWithTotp({
    pendingToken,
    code,
    userAgent,
    ipAddress,
    deviceName,
    locale,
  });

  if (isMobile) {
    return res
      .status(200)
      .json({ success: true, data: { user, accessToken, refreshToken } });
  }

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  res.status(200).json({ success: true, data: { user } });
}

async function regenerateBackupCodes(req, res) {
  const { code, locale } = req.body;
  const result = await authService.regenerateBackupCodes({
    userId: req.user.id,
    code,
    locale,
  });
  res.status(200).json({ success: true, data: result });
}

async function registerWithGoogle(req, res) {
  const { idToken, role, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const { user, accessToken, refreshToken } =
    await authService.registerWithGoogle({
      idToken,
      role,
      userAgent,
      ipAddress,
      deviceName,
      locale,
    });

  if (isMobile) {
    return res
      .status(201)
      .json({ success: true, data: { user, accessToken, refreshToken } });
  }

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken);
  res.status(201).json({ success: true, data: { user } });
}

async function loginWithGoogle(req, res) {
  const { idToken, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const result = await authService.loginWithGoogle({
    idToken,
    userAgent,
    ipAddress,
    deviceName,
    locale,
  });

  if (result.requiresTotp) {
    return res.status(200).json({
      success: true,
      data: { requiresTotp: true, pendingToken: result.pendingToken },
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

async function generatePasskeyRegistrationOptions(req, res) {
  const options = await authService.generatePasskeyRegistrationOptions({
    userId: req.user.id,
  });
  res.status(200).json({ success: true, data: options });
}

async function verifyPasskeyRegistration(req, res) {
  const { response, deviceName } = req.body;
  const passkey = await authService.verifyPasskeyRegistration({
    userId: req.user.id,
    response,
    deviceName,
  });
  res.status(201).json({ success: true, data: passkey });
}

async function generatePasskeyLoginOptions(req, res) {
  const { email } = req.body;
  const options = await authService.generatePasskeyLoginOptions({ email });
  res.status(200).json({ success: true, data: options });
}

async function verifyPasskeyLogin(req, res) {
  const { email, challengeId, response, deviceName, locale } = req.body;
  const userAgent = req.headers["user-agent"] || null;
  const ipAddress = req.ip || null;
  const isMobile = req.headers["x-client-type"] === "mobile";

  const result = await authService.verifyPasskeyLogin({
    email,
    challengeId,
    response,
    userAgent,
    ipAddress,
    deviceName,
    locale,
  });

  if (result.requiresTotp) {
    return res.status(200).json({
      success: true,
      data: { requiresTotp: true, pendingToken: result.pendingToken },
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

async function listPasskeys(req, res) {
  const passkeys = await authService.listPasskeys({ userId: req.user.id });
  res.status(200).json({ success: true, data: passkeys });
}

async function deletePasskey(req, res) {
  const { passkeyId } = req.params;
  const result = await authService.deletePasskey({
    userId: req.user.id,
    passkeyId,
  });
  res.status(200).json({ success: true, data: result });
}

module.exports = {
  createAccount,
  verifyEmail,
  resendEmailVerification,
  requestLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
  refreshAccessToken,
  getMe,
  logout,
  logoutAll,
  listSessions,
  revokeSession,
  createPassword,
  updatePassword,
  forgotPassword,
  resetPassword,
  setupTotp,
  confirmTotp,
  disableTotp,
  loginWithTotp,
  regenerateBackupCodes,
  registerWithGoogle,
  loginWithGoogle,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyLoginOptions,
  verifyPasskeyLogin,
  listPasskeys,
  deletePasskey,
};
