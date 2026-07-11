const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { catchAsync } = require("../../../shared/utils/catchAsync");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const { sendOtpEmail } = require("../../../services/email.service");
const { sendOtpSms } = require("../../../services/sms.service");
const totpService = require("../services/totp.service");
const { createLoginSession } = require("../services/auth.service");

const setupTotp = catchAsync(async (req, res) => {
  const result = await totpService.setupTotp({ userId: req.user.id });
  res.status(200).json({
    success: true,
    message: "Scannez le QR code avec votre application d'authentification.",
    data: result,
  });
});

const enableTotp = catchAsync(async (req, res) => {
  const { code } = req.body;
  if (!code) throw errors.badRequest("Le code de vérification est requis.");
  const result = await totpService.enableTotp({ userId: req.user.id, code });
  res.status(200).json({
    success: true,
    message:
      "Authentification à deux facteurs activée. Conservez vos codes de secours en lieu sûr.",
    data: result,
  });
});

const verifyTotp = catchAsync(async (req, res) => {
  const { userId, code } = req.body;
  if (!userId) throw errors.badRequest("L'identifiant utilisateur est requis.");
  if (!code) throw errors.badRequest("Le code est requis.");

  const totpResult = await totpService.verifyTotp({ userId, code });

  const sessionResult = await createLoginSession(totpResult.user, req, res);

  res.status(200).json({
    success: true,
    message: "Authentification réussie.",
    data: {
      usedBackupCode: totpResult.usedBackupCode || false,
      user: sessionResult.user,
      ...(sessionResult.accessToken && {
        accessToken: sessionResult.accessToken,
      }),
      ...(sessionResult.refreshToken && {
        refreshToken: sessionResult.refreshToken,
      }),
    },
  });
});

const requestDisableTotp = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      totp: { select: { isEnabled: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.totp?.isEnabled) {
    throw errors.badRequest("La 2FA n'est pas activée sur ce compte.");
  }

  const target = user.email || user.phone;
  const code = await createOtp(user.id, "DISABLE_2FA", target);

  if (user.email) {
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "2fa",
    });
  } else {
    await sendOtpSms({ to: user.phone, code });
  }

  const masked = user.email
    ? `${user.email[0]}***@${user.email.split("@")[1]}`
    : `${user.phone.slice(0, 4)}****${user.phone.slice(-3)}`;

  res.status(200).json({
    success: true,
    message: `Un code de confirmation a été envoyé à ${masked}.`,
    data: { type: user.email ? "email" : "phone", target: masked },
  });
});

const disableTotp = catchAsync(async (req, res) => {
  const { totpCode, otpCode } = req.body;

  if (!totpCode && !otpCode) {
    throw errors.badRequest(
      "Un code TOTP ou un code de confirmation est requis.",
    );
  }

  if (otpCode) {
    await verifyOtp(req.user.id, "DISABLE_2FA", otpCode);
    await prisma.otp.deleteMany({
      where: { userId: req.user.id, type: "DISABLE_2FA" },
    });
    await totpService.disableTotpDirect({ userId: req.user.id });
  } else {
    await totpService.disableTotp({ userId: req.user.id, code: totpCode });
  }

  res.status(200).json({
    success: true,
    message: "Authentification à deux facteurs désactivée.",
  });
});

const requestRegenerateBackupCodes = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      totp: { select: { isEnabled: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.totp?.isEnabled) {
    throw errors.badRequest("La 2FA n'est pas activée sur ce compte.");
  }

  const target = user.email || user.phone;
  const code = await createOtp(user.id, "REGENERATE_BACKUP_CODES", target);

  if (user.email) {
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "2fa",
    });
  } else {
    await sendOtpSms({ to: user.phone, code });
  }

  const masked = user.email
    ? `${user.email[0]}***@${user.email.split("@")[1]}`
    : `${user.phone.slice(0, 4)}****${user.phone.slice(-3)}`;

  res.status(200).json({
    success: true,
    message: `Un code de confirmation a été envoyé à ${masked}.`,
    data: { type: user.email ? "email" : "phone", target: masked },
  });
});

const regenerateBackupCodes = catchAsync(async (req, res) => {
  const { totpCode, otpCode } = req.body;

  if (!totpCode && !otpCode) {
    throw errors.badRequest(
      "Un code TOTP ou un code de confirmation est requis.",
    );
  }

  let result;

  if (otpCode) {
    await verifyOtp(req.user.id, "REGENERATE_BACKUP_CODES", otpCode);
    await prisma.otp.deleteMany({
      where: { userId: req.user.id, type: "REGENERATE_BACKUP_CODES" },
    });
    result = await totpService.regenerateBackupCodesDirect({
      userId: req.user.id,
    });
  } else {
    result = await totpService.regenerateBackupCodes({
      userId: req.user.id,
      code: totpCode,
    });
  }

  res.status(200).json({
    success: true,
    message: "Codes de secours régénérés.",
    data: result,
  });
});

module.exports = {
  setupTotp,
  enableTotp,
  verifyTotp,
  requestDisableTotp,
  disableTotp,
  requestRegenerateBackupCodes,
  regenerateBackupCodes,
};
