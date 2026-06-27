const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const profileService = require("../services/profile.service");

const getProfile = catchAsync(async (req, res) => {
  const profile = await profileService.getProfile({ userId: req.user.id });
  res.status(200).json({ success: true, data: profile });
});

const updateProfile = catchAsync(async (req, res) => {
  const { name } = req.body;
  const profile = await profileService.updateProfile({
    userId: req.user.id,
    name,
  });
  res.status(200).json({
    success: true,
    message: "Profil mis à jour.",
    data: profile,
  });
});

const updateAvatar = catchAsync(async (req, res) => {
  if (!req.file) throw errors.badRequest("Aucune image fournie.");
  const profile = await profileService.updateAvatar({
    userId: req.user.id,
    fileUrl: req.file.path,
  });
  res.status(200).json({
    success: true,
    message: "Photo de profil mise à jour.",
    data: profile,
  });
});

const deleteAccount = catchAsync(async (req, res) => {
  await profileService.deleteAccount({ userId: req.user.id });
  res.clearCookie("accessToken").clearCookie("refreshToken").status(200).json({
    success: true,
    message:
      "Votre compte a été supprimé. Vous disposez de 30 jours pour le récupérer.",
  });
});

const requestRecoverAccount = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw errors.badRequest("L'identifiant utilisateur est requis.");

  const result = await profileService.requestRecoverAccount({ email });
  res.status(200).json({
    success: true,
    message: `Un code de récupération a été envoyé à ${result.target}.`,
    data: result,
  });
});

const recoverAccount = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  if (!email) throw errors.badRequest("L'identifiant utilisateur est requis.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await profileService.recoverAccount({ email, code });
  res.status(200).json({
    success: true,
    message:
      "Votre compte a été récupéré. Vous pouvez maintenant vous reconnecter.",
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  deleteAccount,
  requestRecoverAccount,
  recoverAccount,
};
