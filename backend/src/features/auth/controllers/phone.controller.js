const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const phoneService = require("../services/phone.service");

const requestAddPhone = catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw errors.badRequest("Le numéro de téléphone est requis.");

  const result = await phoneService.requestAddPhone({
    userId: req.user.id,
    phone,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé au ${result.target}.`,
    data: result,
  });
});

const verifyAddPhone = catchAsync(async (req, res) => {
  const { phone, code } = req.body;
  if (!phone) throw errors.badRequest("Le numéro de téléphone est requis.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await phoneService.verifyAddPhone({
    userId: req.user.id,
    phone,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Numéro de téléphone ajouté avec succès.",
  });
});

const requestUpdatePhone = catchAsync(async (req, res) => {
  const { phone } = req.body;
  if (!phone)
    throw errors.badRequest("Le nouveau numéro de téléphone est requis.");

  const result = await phoneService.requestUpdatePhone({
    userId: req.user.id,
    newPhone: phone,
  });

  res.status(200).json({
    success: true,
    message: `Un code de vérification a été envoyé au ${result.target}.`,
    data: result,
  });
});

const verifyUpdatePhone = catchAsync(async (req, res) => {
  const { phone, code } = req.body;
  if (!phone)
    throw errors.badRequest("Le nouveau numéro de téléphone est requis.");
  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await phoneService.verifyUpdatePhone({
    userId: req.user.id,
    newPhone: phone,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Numéro de téléphone mis à jour avec succès.",
  });
});

module.exports = {
  requestAddPhone,
  verifyAddPhone,
  requestUpdatePhone,
  verifyUpdatePhone,
};
