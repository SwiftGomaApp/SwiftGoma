const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const authService = require("../services/auth.service");
const { prisma } = require("../../../config/db.config");
const {
  getRefreshToken,
  verifyRefreshToken,
  clearAuthCookies,
  setAuthCookies,
  setRefreshCookie,
  signAccessToken,
} = require("../../../shared/utils/cookie.utils");
const { USER_SELECT } = require("../constants/prisma-selects");
const {
  detectIdentifierType,
} = require("../../../shared/utils/validatePhone.utils");
const {
  revokeSession,
  revokeAllSessions,
  createSession,
} = require("../../../shared/utils/session.utils");
const { detectDevice } = require("../../../shared/utils/device.utils");
const {
  getPlatform,
  getDeviceId,
} = require("../../../shared/utils/platform.utils");

const register = catchAsync(async (req, res) => {
  const { name, identifier, email, phone, role } = req.body;

  let resolvedEmail = email || null;
  let resolvedPhone = phone || null;

  if (identifier && !email && !phone) {
    const type = detectIdentifierType(identifier);
    if (type === "email") resolvedEmail = identifier;
    else if (type === "phone") resolvedPhone = identifier;
    else
      throw errors.badRequest(
        "Veuillez entrer une adresse email ou un numéro de téléphone valide.",
      );
  }

  const result = await authService.register({
    name,
    email: resolvedEmail,
    phone: resolvedPhone,
    role,
  });

  res.status(201).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: { userId: result.userId, type: result.type, target: result.target },
  });
});

const verifyAccount = catchAsync(async (req, res) => {
  const { userId, code } = req.body;
  if (!userId) throw errors.badRequest("L'identifiant utilisateur est requis.");
  if (!code) throw errors.badRequest("Le code OTP est requis.");
  const result = await authService.verifyAccount({ userId, code });
  res.status(200).json({
    success: true,
    message:
      "Compte vérifié avec succès. Vous pouvez maintenant vous connecter.",
    data: { userId: result.userId, name: result.name },
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const { userId, type } = req.body;

  if (!userId) throw errors.badRequest("L'identifiant utilisateur est requis.");

  const allowedTypes = ["ACCOUNT_VERIFICATION", "SIGNIN", "RESET_PASSWORD"];
  if (!type || !allowedTypes.includes(type)) {
    throw errors.badRequest("Type OTP invalide.");
  }

  const result = await authService.resendOtp({ userId, type });

  res.status(200).json({
    success: true,
    message: `Un nouveau code a été envoyé à ${result.target}.`,
    data: result,
  });
});

const loginWithOtp = catchAsync(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) throw errors.badRequest("L'identifiant est requis.");
  const result = await authService.loginWithOtp({ identifier });
  res.status(200).json({
    success: true,
    message: `Un code de connexion a été envoyé à ${result.target}.`,
    data: { userId: result.userId, type: result.type, target: result.target },
  });
});

const verifyLoginOtp = catchAsync(async (req, res) => {
  const { userId, code } = req.body;
  if (!userId) throw errors.badRequest("L'identifiant utilisateur est requis.");
  if (!code) throw errors.badRequest("Le code OTP est requis.");

  const result = await authService.verifyLoginOtp({ userId, code }, req, res);

  const totp = await prisma.totp.findUnique({
    where: { userId: result.user.id },
    select: { isEnabled: true },
  });

  if (totp?.isEnabled) {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      requires2fa: true,
      data: { userId: result.user.id },
    });
  }

  res.status(200).json({
    success: true,
    message: "Connexion réussie. Bienvenue sur SwiftGoma !",
    data: {
      user: result.user,
      ...(result.accessToken && { accessToken: result.accessToken }),
      ...(result.refreshToken && { refreshToken: result.refreshToken }),
    },
  });
});

const createPassword = catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password) throw errors.badRequest("Le mot de passe est requis.");

  await authService.createPassword({ userId: req.user.id, password });

  res.status(200).json({
    success: true,
    message: "Mot de passe créé avec succès.",
  });
});

const loginWithPassword = catchAsync(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier) throw errors.badRequest("L'identifiant est requis.");
  if (!password) throw errors.badRequest("Le mot de passe est requis.");

  const result = await authService.loginWithPassword(
    { identifier, password },
    req,
    res,
  );

  const totp = await prisma.totp.findUnique({
    where: { userId: result.user.id },
    select: { isEnabled: true },
  });

  if (totp?.isEnabled) {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      requires2fa: true,
      data: { userId: result.user.id },
    });
  }

  res.status(200).json({
    success: true,
    message: "Connexion réussie. Bienvenue sur SwiftGoma !",
    data: {
      user: result.user,
      ...(result.accessToken && { accessToken: result.accessToken }),
      ...(result.refreshToken && { refreshToken: result.refreshToken }),
    },
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) throw errors.badRequest("L'identifiant est requis.");
  const result = await authService.forgotPassword({ identifier });
  res.status(200).json({
    success: true,
    message: `Un code de réinitialisation a été envoyé à ${result.target}.`,
    data: { userId: result.userId, target: result.target, type: result.type },
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { userId, code, newPassword } = req.body;
  if (!userId) throw errors.badRequest("L'identifiant utilisateur est requis.");
  if (!code) throw errors.badRequest("Le code OTP est requis.");
  if (!newPassword)
    throw errors.badRequest("Le nouveau mot de passe est requis.");
  await authService.resetPassword({ userId, code, newPassword });
  res.status(200).json({
    success: true,
    message:
      "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
  });
});

const getMe = catchAsync(async (req, res) => {
  const { password, sessionId, ...user } = req.user;

  const passwordCheck = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true, passwordChangedAt: true },
  });

  res.status(200).json({
    success: true,
    data: {
      ...user,
      hasPassword: !!passwordCheck?.password,
      passwordChangedAt: passwordCheck?.passwordChangedAt ?? null,
      currentSessionId: sessionId,
    },
  });
});

const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword)
    throw errors.badRequest("Le mot de passe actuel est requis.");
  if (!newPassword)
    throw errors.badRequest("Le nouveau mot de passe est requis.");

  await authService.updatePassword({
    userId: req.user.id,
    currentPassword,
    newPassword,
  });

  res.status(200).json({
    success: true,
    message: "Mot de passe mis à jour avec succès.",
  });
});

const logout = catchAsync(async (req, res) => {
  await revokeSession(req.user.sessionId);
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: "Déconnexion réussie." });
});

const logoutAll = catchAsync(async (req, res) => {
  await revokeAllSessions(req.user.id);
  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: "Déconnexion de toutes les sessions réussie.",
  });
});

const refresh = catchAsync(async (req, res) => {
  const token = getRefreshToken(req);
  const platform = getPlatform(req);
  const deviceId = getDeviceId(req);

  if (!token) throw errors.unauthorized();
  if (platform === "MOBILE" && !deviceId) {
    throw errors.badRequest("Identifiant d'appareil requis.");
  }

  verifyRefreshToken(token);

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      sessionId: true,
      expiresAt: true,
      revokedAt: true,
      platform: true,
      deviceId: true,
      replacedByToken: true,
      user: { select: USER_SELECT },
    },
  });

  if (!stored) throw errors.tokenExpired();
  if (new Date() > stored.expiresAt) throw errors.tokenExpired();
  if (!stored.user.isActive) throw errors.forbidden();
  if (stored.user.isDeleted) throw errors.accountDeleted();

  if (stored.revokedAt && !stored.replacedByToken) throw errors.tokenExpired();

  const { session, refreshToken: newRefreshToken } = await rotateRefreshToken({
    storedToken: stored,
    role: stored.user.role,
    deviceInfo: detectDevice(req),
    platform,
    deviceId,
  });

  if (platform === "MOBILE") {
    const accessToken = signAccessToken({
      userId: stored.userId,
      role: stored.user.role,
      sessionId: session.id,
    });

    return res.status(200).json({
      success: true,
      message: "Token rafraîchi.",
      data: { accessToken, refreshToken: newRefreshToken },
    });
  }

  setAuthCookies(res, {
    userId: stored.userId,
    role: stored.user.role,
    sessionId: session.id,
  });
  setRefreshCookie(res, newRefreshToken);

  res.status(200).json({ success: true, message: "Token rafraîchi." });
});

module.exports = {
  register,
  verifyAccount,
  resendOtp,
  loginWithOtp,
  updatePassword,
  verifyLoginOtp,
  createPassword,
  loginWithPassword,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  logoutAll,
  refresh,
};
