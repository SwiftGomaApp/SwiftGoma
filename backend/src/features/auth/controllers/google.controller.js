const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const googleService = require("../services/google.service");
const { createLoginSession } = require("../services/auth.service");
const { sendWelcomeEmail } = require("../../../services/email.service");
const { prisma } = require("../../../config/db.config");
const { clearAuthCookies } = require("../../../shared/utils/cookie.utils");

const registerWithGoogle = catchAsync(async (req, res) => {
  const { idToken, role } = req.body;

  if (!idToken) throw errors.badRequest("Le token Google est requis.");
  if (!role) throw errors.badRequest("Le rôle est requis.");

  const { user, isNew } = await googleService.registerWithGoogle({
    idToken,
    role,
  });

  const totp = await prisma.totp.findUnique({
    where: { userId: user.id },
    select: { isEnabled: true },
  });

  if (totp?.isEnabled) {
    clearAuthCookies(res); // no-op for mobile, harmless
    return res.status(200).json({
      success: true,
      requires2fa: true,
      data: { userId: user.id },
    });
  }

  const result = await createLoginSession(user, req, res);

  if (isNew) {
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    }).catch(() => {});
  }

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew
      ? "Compte créé avec succès via Google."
      : "Compte Google lié et connexion réussie.",
    data: {
      user: result.user,
      ...(result.accessToken && { accessToken: result.accessToken }),
      ...(result.refreshToken && { refreshToken: result.refreshToken }),
    },
  });
});

const loginWithGoogle = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) throw errors.badRequest("Le token Google est requis.");

  const user = await googleService.loginWithGoogle({ idToken });

  const totp = await prisma.totp.findUnique({
    where: { userId: user.id },
    select: { isEnabled: true },
  });

  if (totp?.isEnabled) {
    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      requires2fa: true,
      data: { userId: user.id },
    });
  }

  const result = await createLoginSession(user, req, res);

  res.status(200).json({
    success: true,
    message: "Connexion réussie via Google.",
    data: {
      user: result.user,
      ...(result.accessToken && { accessToken: result.accessToken }),
      ...(result.refreshToken && { refreshToken: result.refreshToken }),
    },
  });
});

const linkGoogleAccount = catchAsync(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) throw errors.badRequest("Le token Google est requis.");

  await googleService.linkGoogle({ userId: req.user.id, idToken });

  res.status(200).json({
    success: true,
    message: "Compte Google lié avec succès.",
  });
});

const unlinkGoogleAccount = catchAsync(async (req, res) => {
  await googleService.unlinkGoogle({ userId: req.user.id });

  res.status(200).json({
    success: true,
    message: "Compte Google délié avec succès.",
  });
});

const requestUnlinkGoogleAccount = catchAsync(async (req, res) => {
  const result = await googleService.requestUnlinkGoogle({
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: result,
  });
});

const verifyUnlinkGoogleAccount = catchAsync(async (req, res) => {
  const { code } = req.body;
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await googleService.verifyUnlinkGoogle({ userId: req.user.id, code });

  res.status(200).json({
    success: true,
    message: "Compte Google délié avec succès.",
  });
});

module.exports = {
  registerWithGoogle,
  loginWithGoogle,
  linkGoogleAccount,
  unlinkGoogleAccount,
  requestUnlinkGoogleAccount,
  verifyUnlinkGoogleAccount,
};
