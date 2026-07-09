const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const bcrypt = require("bcryptjs");
const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { send2faStatusEmail } = require("../../../services/email.service");

const setupTotp = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true, totp: true },
  });

  if (!user) throw errors.accountNotFound();
  if (user.totp?.isEnabled) {
    throw errors.badRequest("L'authentification TOTP est déjà activée.");
  }

  const secret = speakeasy.generateSecret({
    name: `SwiftGoma (${user.email || user.phone})`,
    issuer: "SwiftGoma",
    length: 20,
  });

  await prisma.totp.upsert({
    where: { userId },
    create: {
      userId,
      secret: secret.base32,
      isEnabled: false,
    },
    update: {
      secret: secret.base32,
      isEnabled: false,
      enabledAt: null,
    },
  });

  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
  };
};

const enableTotp = async ({ userId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw errors.accountNotFound();

  const totp = await prisma.totp.findUnique({
    where: { userId },
    select: { id: true, secret: true, isEnabled: true },
  });

  if (!totp) {
    throw errors.badRequest(
      "Aucune configuration TOTP trouvée. Lancez d'abord la configuration.",
    );
  }

  if (totp.isEnabled) {
    throw errors.badRequest("L'authentification TOTP est déjà activée.");
  }

  const isValid = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw errors.badRequest(
      "Code invalide. Vérifiez l'heure de votre application et réessayez.",
    );
  }

  const plainCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );

  const hashedCodes = await Promise.all(
    plainCodes.map((c) => bcrypt.hash(c, 10)),
  );

  await prisma.$transaction([
    prisma.totp.update({
      where: { userId },
      data: { isEnabled: true, enabledAt: new Date() },
    }),
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({
      data: hashedCodes.map((hash) => ({ userId, code: hash })),
    }),
  ]);

  if (user.email) {
    send2faStatusEmail({
      to: user.email,
      name: user.name,
      enabled: true,
    }).catch((err) => console.error("📧 2FA status email error:", err.message));
  }

  return { backupCodes: plainCodes };
};

const verifyTotp = async ({ userId, code }, req, res) => {
  const totp = await prisma.totp.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });

  if (!totp?.isEnabled) {
    throw errors.badRequest("La 2FA n'est pas activée sur ce compte.");
  }

  const isValid = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (isValid) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return { verified: true, user };
  }

  const backupCodes = await prisma.backupCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, code: true },
  });

  for (const backup of backupCodes) {
    const match = await bcrypt.compare(code, backup.code);
    if (match) {
      await prisma.backupCode.update({
        where: { id: backup.id },
        data: { usedAt: new Date() },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      return { verified: true, usedBackupCode: true, user };
    }
  }

  throw errors.badRequest(
    "Code invalide. Vérifiez votre application ou utilisez un code de secours.",
  );
};

const disableTotp = async ({ userId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw errors.accountNotFound();

  const totp = await prisma.totp.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });

  if (!totp?.isEnabled) {
    throw errors.badRequest("La 2FA n'est pas activée sur ce compte.");
  }

  const isValid = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw errors.badRequest("Code invalide. Impossible de désactiver la 2FA.");
  }

  await prisma.$transaction([
    prisma.totp.update({
      where: { userId },
      data: { isEnabled: false, enabledAt: null, secret: "" },
    }),
    prisma.backupCode.deleteMany({ where: { userId } }),
  ]);

  if (user.email) {
    send2faStatusEmail({
      to: user.email,
      name: user.name,
      enabled: false,
    }).catch((err) => console.error("📧 2FA status email error:", err.message));
  }

  return true;
};

// Désactiver sans vérifier le code TOTP (OTP déjà vérifié dans le controller)
const disableTotpDirect = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw errors.accountNotFound();

  await prisma.$transaction([
    prisma.totp.update({
      where: { userId },
      data: { isEnabled: false, enabledAt: null, secret: "" },
    }),
    prisma.backupCode.deleteMany({ where: { userId } }),
  ]);

  if (user.email) {
    send2faStatusEmail({
      to: user.email,
      name: user.name,
      enabled: false,
    }).catch((err) => console.error("📧 2FA status email error:", err.message));
  }

  return true;
};

// Régénérer sans vérifier le code TOTP (OTP déjà vérifié dans le controller)
const regenerateBackupCodesDirect = async ({ userId }) => {
  const plainCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );

  const hashedCodes = await Promise.all(
    plainCodes.map((c) => bcrypt.hash(c, 10)),
  );

  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({
      data: hashedCodes.map((hash) => ({ userId, code: hash })),
    }),
  ]);

  return { backupCodes: plainCodes };
};

const regenerateBackupCodes = async ({ userId, code }) => {
  const totp = await prisma.totp.findUnique({
    where: { userId },
    select: { secret: true, isEnabled: true },
  });

  if (!totp?.isEnabled) {
    throw errors.badRequest("La 2FA n'est pas activée sur ce compte.");
  }

  const isValid = speakeasy.totp.verify({
    secret: totp.secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!isValid) {
    throw errors.badRequest("Code invalide.");
  }

  const plainCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );

  const hashedCodes = await Promise.all(
    plainCodes.map((c) => bcrypt.hash(c, 10)),
  );

  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({
      data: hashedCodes.map((hash) => ({ userId, code: hash })),
    }),
  ]);

  return { backupCodes: plainCodes };
};

module.exports = {
  setupTotp,
  enableTotp,
  verifyTotp,
  disableTotp,
  disableTotpDirect,
  regenerateBackupCodes,
  regenerateBackupCodesDirect,
};
