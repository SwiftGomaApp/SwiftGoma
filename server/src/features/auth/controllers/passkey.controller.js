const { catchAsync } = require("../../../shared/utils/catchAsync");
const { errors } = require("../../../shared/errors/app.error");
const passkeyService = require("../services/passkey.service");
const { createLoginSession } = require("../services/auth.service");

const getRegistrationOptions = catchAsync(async (req, res) => {
  const options = await passkeyService.getRegistrationOptions({
    userId: req.user.id,
  });

  res.status(200).json({ success: true, data: options });
});

const verifyRegistration = catchAsync(async (req, res) => {
  const { credential, name } = req.body;
  if (!credential)
    throw errors.badRequest("Les données de la clé d'accès sont requises.");

  await passkeyService.verifyRegistration({
    userId: req.user.id,
    credential,
    name,
  });

  res.status(201).json({
    success: true,
    message: "Clé d'accès enregistrée avec succès.",
  });
});

const getAuthenticationOptions = catchAsync(async (req, res) => {
  const options = await passkeyService.getAuthenticationOptions();

  res.status(200).json({ success: true, data: options });
});

const verifyAuthentication = catchAsync(async (req, res) => {
  const { credential } = req.body;
  if (!credential)
    throw errors.badRequest("Les données de la clé d'accès sont requises.");

  const user = await passkeyService.verifyAuthentication({ credential });

  await createLoginSession(user, req, res);

  res.status(200).json({
    success: true,
    message: "Authentification réussie.",
  });
});

const listPasskeys = catchAsync(async (req, res) => {
  const passkeys = await passkeyService.listPasskeys({ userId: req.user.id });

  res.status(200).json({ success: true, data: passkeys });
});

const requestRemovePasskeyHandler = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await passkeyService.requestRemovePasskey({
    userId: req.user.id,
    passkeyId: id,
  });

  res.status(200).json({
    success: true,
    message: `Code OTP envoyé à ${result.target}.`,
    data: result,
  });
});

const removePasskey = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { code } = req.body;

  if (!code) throw errors.badRequest("Le code de vérification est requis.");

  await passkeyService.removePasskey({
    userId: req.user.id,
    passkeyId: id,
    code,
  });

  res.status(200).json({
    success: true,
    message: "Passkey supprimée avec succès.",
  });
});

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  listPasskeys,
  requestRemovePasskeyHandler,
  removePasskey,
};
