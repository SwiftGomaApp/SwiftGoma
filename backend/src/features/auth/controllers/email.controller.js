const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const emailService = require("../services/email.service");

const requestAddSecondaryEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw errors.badRequest("L'adresse e-mail est requise.");

  const result = await emailService.requestAddSecondaryEmail({
    userId: req.user.id,
    email,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: result,
  });
});

const verifyAddSecondaryEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  if (!email) throw errors.badRequest("L'adresse e-mail est requise.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await emailService.verifyAddSecondaryEmail({
    userId: req.user.id,
    email,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Adresse e-mail secondaire ajoutée avec succès.",
  });
});

const removeSecondaryEmail = catchAsync(async (req, res) => {
  const result = await emailService.removeSecondaryEmail({
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: result,
  });
});

const verifyRemoveSecondaryEmail = catchAsync(async (req, res) => {
  const { code } = req.body;
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await emailService.verifyRemoveSecondaryEmail({
    userId: req.user.id,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Adresse e-mail secondaire supprimée.",
  });
});

const requestUpdateEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email)
    throw errors.badRequest("La nouvelle adresse e-mail est requise.");

  const result = await emailService.requestUpdateEmail({
    userId: req.user.id,
    newEmail: email,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: result,
  });
});

const verifyUpdateEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  if (!email)
    throw errors.badRequest("La nouvelle adresse e-mail est requise.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await emailService.verifyUpdateEmail({
    userId: req.user.id,
    newEmail: email,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Adresse e-mail principale mise à jour avec succès.",
  });
});

const requestAddPrimaryEmail = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw errors.badRequest("L'adresse e-mail est requise.");

  const result = await emailService.requestAddPrimaryEmail({
    userId: req.user.id,
    email,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé à ${result.target}.`,
    data: result,
  });
});

const verifyAddPrimaryEmail = catchAsync(async (req, res) => {
  const { email, code } = req.body;
  if (!email) throw errors.badRequest("L'adresse e-mail est requise.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await emailService.verifyAddPrimaryEmail({
    userId: req.user.id,
    email,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Adresse e-mail ajoutée avec succès.",
  });
});

module.exports = {
  requestAddSecondaryEmail,
  verifyAddSecondaryEmail,
  removeSecondaryEmail,
  requestUpdateEmail,
  verifyUpdateEmail,
  requestAddPrimaryEmail,
  verifyAddPrimaryEmail,
  verifyRemoveSecondaryEmail,
};
