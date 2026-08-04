const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  sendOtpLoginEmail,
  sendPhoneChangedEmail,
  sendAccountDeletionEmail,
  sendAccountRecoveryOtpEmail,
  accountDeletionEmail,
} = require("../../../common/emails");
const { sendSms } = require("../../../config/sms");
const { uploadImage } = require("../../../common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../../../common/constants/cloudinaryFolders");
const {
  AppError,
  ValidationError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} = require("../../../common/errors");
const {
  isValidName,
  isValidPhone,
  isValidEmail,
  generateVerificationOtp,
  getOtpExpiry,
  isOtpExpired,
  safeCompareCode,
} = require("../../auth/utils/auth");
const {
  issueSessionAndNotify,
  sanitizeUser,
  logoutAll,
} = require("../../auth/services/auth.service");
const { ACCOUNT_DELETION_CONFIG } = require("../config/accountDeletion.config");
const { isWithinRecoveryGracePeriod } = require("../utils/accountDeletion");
const { verifyGoogleIdToken } = require("../../auth/config/google.config");
const { maskPhone } = require("../utils/phone");
const {
  accountStatusEmail,
} = require("../../../common/emails/templates/accountStatus");
const {
  sessionsRevokedEmail,
} = require("../../../common/emails/templates/sessionsRevoked");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const PHONE_OTP_TTL_MINUTES = 10;
const PHONE_OTP_RESEND_COOLDOWN_SECONDS = 30;
const MAX_LIMIT = 100;
const PRIVILEGED_ROLES = ["ADMIN", "SUPPORT"];
const VALID_ROLES = ["BUYER", "SELLER", "RIDER", "ADMIN", "SUPPORT"];
const SECONDARY_EMAIL_OTP_TTL_MINUTES = 10;

const SENSITIVE_FIELDS = [
  "password",
  "phoneVerificationCode",
  "phoneVerificationCodeExpiresAt",
  "loginOtp",
  "loginOtpExpiresAt",
  "passwordResetCode",
  "passwordResetCodeExpiresAt",
  "accountRecoveryCode",
  "accountRecoveryCodeExpiresAt",
];

const prisma = getPrismaClient();

function getPrimaryEmail(user) {
  return (user.emails || []).find((e) => e.isPrimary) || null;
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || 20, 1),
    MAX_LIMIT,
  );
  return { page, limit, skip: (page - 1) * limit };
}

function buildStatusFilter(status) {
  switch (status) {
    case "blocked":
      return { isBlocked: true, deletedAt: null };
    case "deleted":
      return { deletedAt: { not: null } };
    case "active":
      return { isBlocked: false, deletedAt: null };
    default:
      return {};
  }
}

function assertCanActOnTarget(actor, targetUser) {
  if (targetUser.id === actor.id) {
    throw new BadRequestError(
      "Vous ne pouvez pas effectuer cette action sur votre propre compte.",
    );
  }
  if (actor.role === "SUPPORT" && PRIVILEGED_ROLES.includes(targetUser.role)) {
    throw new ForbiddenError(
      "SUPPORT ne peut pas agir sur les comptes ADMIN ou SUPPORT.",
    );
  }
}

async function getTargetUserOrThrow(targetUserId) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { emails: { where: { isPrimary: true }, take: 1 } },
  });
  if (!targetUser) throw new NotFoundError("Utilisateur introuvable.");
  return { ...targetUser, email: targetUser.emails[0]?.email ?? "" };
}

async function updateProfile({ userId, name, avatarUrl }) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }

  const data = {};

  if (name !== undefined) {
    if (!isValidName(name)) {
      throw new ValidationError("Veuillez entrer un nom valide.");
    }
    data.name = name.trim();
  }

  if (avatarUrl !== undefined) {
    data.avatarUrl = avatarUrl;
  }

  if (Object.keys(data).length === 0) {
    throw new ValidationError("Rien à mettre à jour.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    include: { emails: true, twoFactorAuth: true },
  });

  return sanitizeUser(updated);
}

async function deleteAccount({ userId, reason, locale = "en" }) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });

  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (user.deletedAt) {
    throw new ConflictError("Ce compte est déjà supprimé.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), deletionReason: reason || null },
  });

  await logoutAll(userId);

  try {
    const primaryEmail = getPrimaryEmail(user);
    if (primaryEmail) {
      await sendAccountDeletionEmail(primaryEmail.email, {
        name: user.name,
        action: "deleted",
        actionUrl: env.appUrl + "/account/recovery",
        recoveryDays: ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS,
        locale,
      });
    }
  } catch (err) {
    console.error(
      "[user] Failed to send account-deletion notification:",
      err.message,
    );
  }

  return {
    message:
      "Votre compte a été supprimé. Vous pouvez le récupérer dans les " +
      ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS +
      " jours.",
  };
}

async function requestAccountRecovery({ email, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const GENERIC_RESPONSE = {
    message:
      "Si un compte récupérable existe avec cet email, un code de récupération a été envoyé.",
  };

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  if (!userEmail) return GENERIC_RESPONSE;
  const user = userEmail.user;
  if (!user.deletedAt) return GENERIC_RESPONSE;
  if (!isWithinRecoveryGracePeriod(user.deletedAt)) return GENERIC_RESPONSE;

  if (user.accountRecoveryCode && user.accountRecoveryCodeExpiresAt) {
    const requestedAt = new Date(
      user.accountRecoveryCodeExpiresAt.getTime() -
        ACCOUNT_DELETION_CONFIG.RECOVERY_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() +
        ACCOUNT_DELETION_CONFIG.RECOVERY_OTP_RESEND_COOLDOWN_SECONDS * 1000,
    );
    const now = new Date();
    if (cooldownEndsAt > now) {
      return GENERIC_RESPONSE;
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(
    ACCOUNT_DELETION_CONFIG.RECOVERY_OTP_TTL_MINUTES,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountRecoveryCode: code,
      accountRecoveryCodeExpiresAt: expiresAt,
    },
  });

  await sendAccountRecoveryOtpEmail(normalizedEmail, {
    name: user.name,
    code,
    expiresInMinutes: ACCOUNT_DELETION_CONFIG.RECOVERY_OTP_TTL_MINUTES,
    locale,
  });

  return GENERIC_RESPONSE;
}

async function verifyAccountRecovery({
  email,
  code,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de récupération.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: { include: { emails: true, twoFactorAuth: true } } },
  });

  if (!userEmail) {
    throw new NotFoundError("Aucun compte trouvé avec cet email.");
  }
  const user = userEmail.user;
  if (!user.deletedAt || !isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new NotFoundError("Aucun compte trouvé avec cet email.");
  }
  if (isOtpExpired(user.accountRecoveryCodeExpiresAt)) {
    throw new AppError(
      "Votre code de récupération a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(user.accountRecoveryCode, code)) {
    throw new AppError(
      "Le code de récupération est incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  const restored = await prisma.user.update({
    where: { id: user.id },
    data: {
      deletedAt: null,
      deletionReason: null,
      accountRecoveryCode: null,
      accountRecoveryCodeExpiresAt: null,
    },
    include: { emails: true, twoFactorAuth: true },
  });

  try {
    const primaryEmail = getPrimaryEmail(restored);
    if (primaryEmail) {
      await sendAccountDeletionEmail(primaryEmail.email, {
        name: restored.name,
        action: "restored",
        actionUrl: env.appUrl + "/account/activity",
        locale,
      });
    }
  } catch (err) {
    console.error(
      "[user] Failed to send account-restored notification:",
      err.message,
    );
  }

  if (restored.twoFactorAuth && restored.twoFactorAuth.isEnabled) {
    return { requiresTotp: true, userId: restored.id };
  }

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    restored,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(restored), accessToken, refreshToken, sessionId };
}

async function requestPhoneVerification({ userId, phone }) {
  if (!isValidPhone(phone)) {
    throw new ValidationError("Veuillez entrer un numéro de téléphone valide.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (user.isPhoneVerified) {
    throw new ConflictError(
      "Ce compte a déjà un numéro de téléphone vérifié. Utilisez la mise à jour du téléphone pour le changer.",
    );
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phone, id: { not: userId } },
  });
  if (existingPhone) {
    throw new ConflictError("Ce numéro de téléphone est déjà utilisé.");
  }

  if (
    user.phoneVerificationCode &&
    user.phoneVerificationCodeExpiresAt &&
    user.phone === phone
  ) {
    const requestedAt = new Date(
      user.phoneVerificationCodeExpiresAt.getTime() -
        PHONE_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() + PHONE_OTP_RESEND_COOLDOWN_SECONDS * 1000,
    );
    const now = new Date();
    if (cooldownEndsAt > now) {
      const secondsLeft = Math.ceil((cooldownEndsAt - now) / 1000);
      throw new TooManyRequestsError(
        "Veuillez patienter " +
          secondsLeft +
          " secondes avant de demander un nouveau code.",
      );
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(PHONE_OTP_TTL_MINUTES);

  await prisma.user.update({
    where: { id: userId },
    data: {
      phone,
      isPhoneVerified: false,
      phoneVerificationCode: code,
      phoneVerificationCodeExpiresAt: expiresAt,
    },
  });

  try {
    await sendSms({
      to: phone,
      message:
        code +
        " est votre code de vérification Swiftgoma. Il expire dans " +
        PHONE_OTP_TTL_MINUTES +
        " minutes.",
    });
  } catch (err) {
    console.error("[user] Failed to send phone verification SMS:", err);
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerificationCode: null,
        phoneVerificationCodeExpiresAt: null,
      },
    });
    throw new AppError(
      "Nous n'avons pas pu envoyer le code de vérification. Veuillez réessayer dans un instant.",
      502,
      "SMS_SEND_FAILED",
    );
  }

  return { message: "Un code de vérification a été envoyé à votre téléphone." };
}

async function verifyPhone({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de vérification.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (!user.phone || !user.phoneVerificationCode) {
    throw new ConflictError(
      "Aucune vérification de téléphone en cours. Démarrez d'abord une vérification.",
    );
  }
  if (isOtpExpired(user.phoneVerificationCodeExpiresAt)) {
    throw new AppError(
      "Votre code de vérification a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(user.phoneVerificationCode, code)) {
    throw new AppError(
      "Le code de vérification est incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationCodeExpiresAt: null,
    },
    include: { emails: true, twoFactorAuth: true },
  });

  try {
    const primaryEmail = getPrimaryEmail(updated);
    if (primaryEmail) {
      await sendPhoneChangedEmail(primaryEmail.email, {
        name: updated.name,
        action: "added",
        maskedPhone: maskPhone(updated.phone),
        reviewActivityUrl: env.appUrl + "/account/activity",
        locale,
      });
    }
  } catch (err) {
    console.error(
      "[user] Failed to send phone-changed notification:",
      err.message,
    );
  }

  return sanitizeUser(updated);
}

async function uploadProfilePicture({ userId, buffer }) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }

  const result = await uploadImage(buffer, CLOUDINARY_FOLDERS.PROFILE_PICTURES);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: result.url },
    include: { emails: true, twoFactorAuth: true },
  });

  return sanitizeUser(updated);
}

async function requestPhoneUpdate({ userId, newPhone }) {
  if (!isValidPhone(newPhone)) {
    throw new ValidationError("Veuillez entrer un numéro de téléphone valide.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (!user.isPhoneVerified) {
    throw new ConflictError(
      "Aucun numéro de téléphone vérifié sur ce compte pour l'instant. Utilisez la vérification du téléphone pour en ajouter un d'abord.",
    );
  }
  if (user.phone === newPhone) {
    throw new ConflictError("C'est déjà votre numéro de téléphone actuel.");
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phone: newPhone, id: { not: userId } },
  });
  if (existingPhone) {
    throw new ConflictError("Ce numéro de téléphone est déjà utilisé.");
  }

  if (
    user.phoneVerificationCode &&
    user.phoneVerificationCodeExpiresAt &&
    user.pendingPhone === newPhone
  ) {
    const requestedAt = new Date(
      user.phoneVerificationCodeExpiresAt.getTime() -
        PHONE_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() + PHONE_OTP_RESEND_COOLDOWN_SECONDS * 1000,
    );
    const now = new Date();
    if (cooldownEndsAt > now) {
      const secondsLeft = Math.ceil((cooldownEndsAt - now) / 1000);
      throw new TooManyRequestsError(
        "Veuillez patienter " +
          secondsLeft +
          " secondes avant de demander un nouveau code.",
      );
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(PHONE_OTP_TTL_MINUTES);

  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingPhone: newPhone,
      phoneVerificationCode: code,
      phoneVerificationCodeExpiresAt: expiresAt,
    },
  });

  try {
    await sendSms({
      to: newPhone,
      message:
        code +
        " est votre code de vérification Swiftgoma. Il expire dans " +
        PHONE_OTP_TTL_MINUTES +
        " minutes.",
    });
  } catch (err) {
    console.error("[user] Failed to send phone update SMS:", err);
    await prisma.user.update({
      where: { id: userId },
      data: {
        pendingPhone: null,
        phoneVerificationCode: null,
        phoneVerificationCodeExpiresAt: null,
      },
    });
    throw new AppError(
      "Nous n'avons pas pu envoyer le code de vérification. Veuillez réessayer dans un instant.",
      502,
      "SMS_SEND_FAILED",
    );
  }

  return {
    message:
      "Un code de vérification a été envoyé à votre nouveau numéro de téléphone.",
  };
}

async function verifyPhoneUpdate({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de vérification.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (!user.pendingPhone || !user.phoneVerificationCode) {
    throw new ConflictError(
      "Aucune mise à jour de téléphone en cours. Démarrez d'abord une mise à jour.",
    );
  }
  if (isOtpExpired(user.phoneVerificationCodeExpiresAt)) {
    throw new AppError(
      "Votre code de vérification a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(user.phoneVerificationCode, code)) {
    throw new AppError(
      "Le code de vérification est incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      phone: user.pendingPhone,
      pendingPhone: null,
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationCodeExpiresAt: null,
    },
    include: { emails: true, twoFactorAuth: true },
  });

  try {
    const primaryEmail = getPrimaryEmail(updated);
    if (primaryEmail) {
      await sendPhoneChangedEmail(primaryEmail.email, {
        name: updated.name,
        action: "updated",
        maskedPhone: maskPhone(updated.phone),
        reviewActivityUrl: env.appUrl + "/account/activity",
        locale,
      });
    }
  } catch (err) {
    console.error(
      "[user] Failed to send phone-changed notification:",
      err.message,
    );
  }

  return sanitizeUser(updated);
}

async function requestSecondaryEmail({ userId, email, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }

  const primaryEmail = getPrimaryEmail(user);
  if (primaryEmail && primaryEmail.email === normalizedEmail) {
    throw new ConflictError("C'est déjà votre email principal.");
  }

  const existingSecondary = user.emails.find((e) => !e.isPrimary);
  if (existingSecondary && existingSecondary.isVerified) {
    throw new ConflictError(
      "Ce compte a déjà un email secondaire vérifié. Retirez-le avant d'en ajouter un autre.",
    );
  }

  const existingElsewhere = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingElsewhere && existingElsewhere.userId !== userId) {
    throw new ConflictError("Cet email est déjà utilisé.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(SECONDARY_EMAIL_OTP_TTL_MINUTES);

  if (existingSecondary) {
    await prisma.userEmail.update({
      where: { id: existingSecondary.id },
      data: {
        email: normalizedEmail,
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
      },
    });
  } else {
    await prisma.userEmail.create({
      data: {
        userId,
        email: normalizedEmail,
        isPrimary: false,
        isVerified: false,
        verificationCode: code,
        verificationCodeExpiresAt: expiresAt,
      },
    });
  }

  await sendOtpLoginEmail(normalizedEmail, {
    name: user.name,
    code,
    expiresInMinutes: SECONDARY_EMAIL_OTP_TTL_MINUTES,
    locale,
  });

  return {
    message: "Un code de vérification a été envoyé à votre nouvel email.",
  };
}

async function verifySecondaryEmail({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de vérification.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }

  const pending = user.emails.find(
    (e) => !e.isPrimary && !e.isVerified && e.verificationCode,
  );
  if (!pending) {
    throw new ConflictError(
      "Aucune vérification d'email secondaire en cours. Démarrez-en une d'abord.",
    );
  }
  if (isOtpExpired(pending.verificationCodeExpiresAt)) {
    throw new AppError(
      "Votre code de vérification a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(pending.verificationCode, code)) {
    throw new AppError(
      "Le code de vérification est incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  await prisma.userEmail.update({
    where: { id: pending.id },
    data: {
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
    },
  });

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true, twoFactorAuth: true },
  });

  return sanitizeUser(updated);
}

async function linkGoogleAccount(userId, idToken) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new NotFoundError("Compte introuvable.");
  if (user.deletedAt) throw new BadRequestError("Ce compte est supprimé.");
  if (user.googleId) throw new ConflictError("Un compte Google est déjà lié.");

  const payload = await verifyGoogleIdToken(idToken);
  if (!payload?.googleId) throw new UnauthorizedError("Token Google invalide.");

  const existing = await prisma.user.findUnique({
    where: { googleId: payload.googleId },
  });
  if (existing) {
    throw new ConflictError(
      "Ce compte Google est déjà lié à un autre utilisateur.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleId: payload.googleId },
  });

  return { message: "Compte Google lié avec succès.", googleLinked: true };
}

async function unlinkGoogleAccount(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: { where: { isPrimary: true }, take: 1 } },
  });

  if (!user) throw new NotFoundError("Compte introuvable.");
  if (!user.googleId)
    throw new BadRequestError("Aucun compte Google n'est lié.");

  const hasPassword = Boolean(user.password);
  const hasVerifiedEmail = Boolean(user.emails[0]?.isVerified);

  if (!hasPassword && !hasVerifiedEmail) {
    throw new BadRequestError(
      "Ajoutez un mot de passe ou vérifiez votre e-mail avant de délier Google, pour éviter d'être bloqué hors de votre compte.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleId: null },
  });

  return { message: "Compte Google délié avec succès.", googleLinked: false };
}

async function listUsers(query) {
  const { page, limit, skip } = parsePagination(query);
  const { role, status, search } = query;

  const prisma = getPrismaClient();

  if (
    role &&
    !["BUYER", "SELLER", "RIDER", "ADMIN", "SUPPORT"].includes(role)
  ) {
    throw new BadRequestError("Filtre de rôle invalide.");
  }

  const where = {
    ...(role ? { role } : {}),
    ...buildStatusFilter(status),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { emails: { some: { email: { contains: search.toLowerCase() } } } },
          ],
        }
      : {}),
  };

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isBlocked: true,
        isPhoneVerified: true,
        deletedAt: true,
        createdAt: true,
        emails: {
          select: {
            id: true,
            email: true,
            isPrimary: true,
            isVerified: true,
          },
        },
      },
    }),
  ]);

  return {
    users: users.map((u) => {
      const primary = u.emails.find((e) => e.isPrimary);
      return {
        id: u.id,
        name: u.name,
        email: primary?.email ?? null,
        isEmailVerified: primary?.isVerified ?? false,
        emails: u.emails,
        phone: u.phone,
        isPhoneVerified: u.isPhoneVerified,
        role: u.role,
        isBlocked: u.isBlocked,
        deletedAt: u.deletedAt,
        createdAt: u.createdAt,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getUserDetail(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      emails: {
        select: {
          id: true,
          email: true,
          isPrimary: true,
          isVerified: true,
          createdAt: true,
        },
      },
      sessions: {
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          deviceName: true,
          isRevoked: true,
          lastUsedAt: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { lastUsedAt: "desc" },
      },
      actionsReceived: {
        select: {
          id: true,
          action: true,
          reason: true,
          actorId: true,
          actorRole: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!user) throw new NotFoundError("Utilisateur introuvable.");

  const clean = { ...user };
  for (const field of SENSITIVE_FIELDS) delete clean[field];
  return clean;
}

async function blockUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);
  if (targetUser.deletedAt)
    throw new BadRequestError("Impossible de bloquer un compte supprimé.");
  if (targetUser.isBlocked)
    throw new BadRequestError("L'utilisateur est déjà bloqué.");

  assertCanActOnTarget(actor, targetUser);

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: true },
    }),
    prisma.session.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email ?? "",
        action: "USER_BLOCKED",
        reason: reason || null,
      },
    }),
  ]);

  try {
    const emailContent = accountStatusEmail({
      name: targetUser.name,
      action: "blocked",
      reason,
      actionUrl: `mailto:${require("../../../common/constants/brand").BRAND.supportEmail}`,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: reason
        ? `Votre compte a été bloqué. Raison : ${reason}`
        : "Votre compte a été bloqué par notre équipe.",
      data: { action: "blocked" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify account-blocked:", err.message);
  }

  return { id: updated.id, isBlocked: updated.isBlocked };
}

async function unblockUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);
  if (!targetUser.isBlocked)
    throw new BadRequestError("L'utilisateur n'est pas bloqué.");

  assertCanActOnTarget(actor, targetUser);

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { isBlocked: false },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email ?? "",
        action: "USER_UNBLOCKED",
        reason: reason || null,
      },
    }),
  ]);

  try {
    const emailContent = accountStatusEmail({
      name: targetUser.name,
      action: "unblocked",
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: "Votre compte a été débloqué. Vous pouvez vous reconnecter dès maintenant.",
      data: { action: "unblocked" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify account-unblocked:", err.message);
  }

  return { id: updated.id, isBlocked: updated.isBlocked };
}

async function forceLogout(actor, targetUserId, sessionId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  assertCanActOnTarget(actor, targetUser);

  const where = sessionId
    ? { id: sessionId, userId: targetUserId, isRevoked: false }
    : { userId: targetUserId, isRevoked: false };

  const result = await prisma.session.updateMany({
    where,
    data: { isRevoked: true },
  });

  if (sessionId && result.count === 0) {
    throw new NotFoundError("Session introuvable ou déjà révoquée.");
  }

  await prisma.accountActionLog.create({
    data: {
      actorId: actor.id,
      actorRole: actor.role,
      targetUserId,
      targetUserEmail: targetUser.email ?? "",
      action: sessionId ? "SESSION_REVOKED" : "ALL_SESSIONS_REVOKED",
      reason: reason || null,
      metadata: sessionId ? { sessionId } : { revokedCount: result.count },
    },
  });

  try {
    const scope = sessionId ? "single" : "all";
    const emailContent = sessionsRevokedEmail({
      name: targetUser.name,
      scope,
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body:
        scope === "single"
          ? "Une de vos sessions a été déconnectée par notre équipe."
          : "Toutes vos sessions ont été déconnectées par notre équipe.",
      data: { action: "sessionsRevoked", scope },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify sessions-revoked:", err.message);
  }

  return { revokedCount: result.count };
}

async function verifyUserEmail(actor, targetUserId, emailId) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  const userEmail = await prisma.userEmail.findFirst({
    where: { id: emailId, userId: targetUserId },
  });
  if (!userEmail)
    throw new NotFoundError("Email introuvable pour cet utilisateur.");
  if (userEmail.isVerified) {
    throw new BadRequestError("L'email est déjà vérifié.");
  }

  assertCanActOnTarget(actor, targetUser);

  await prisma.$transaction([
    prisma.userEmail.update({
      where: { id: userEmail.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email,
        action: "EMAIL_MANUALLY_VERIFIED",
        reason: null,
        metadata: {
          verifiedEmail: userEmail.email,
          isPrimary: userEmail.isPrimary,
        },
      },
    }),
  ]);

  return {
    email: userEmail.email,
    isPrimary: userEmail.isPrimary,
    isVerified: true,
  };
}

async function verifyUserPhone(actor, targetUserId) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (!targetUser.phone)
    throw new BadRequestError(
      "Cet utilisateur n'a aucun numéro de téléphone enregistré.",
    );
  if (targetUser.isPhoneVerified) {
    throw new BadRequestError("Le téléphone est déjà vérifié.");
  }

  assertCanActOnTarget(actor, targetUser);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        isPhoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationCodeExpiresAt: null,
      },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email,
        action: "PHONE_MANUALLY_VERIFIED",
        reason: null,
      },
    }),
  ]);

  return { phone: targetUser.phone, isPhoneVerified: true };
}

async function adminDeleteUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (targetUser.deletedAt) {
    throw new BadRequestError("Ce compte est déjà supprimé.");
  }
  if (targetUser.id === actor.id) {
    throw new BadRequestError(
      "Vous ne pouvez pas supprimer votre propre compte de cette façon.",
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: new Date(), deletionReason: reason || null },
    }),
    prisma.session.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email,
        action: "USER_DELETED_BY_ADMIN",
        reason: reason || null,
      },
    }),
  ]);

  try {
    const emailContent = accountDeletionEmail({
      name: targetUser.name,
      action: "deleted",
      actionUrl: `${env.appUrl}/account/recovery`,
      recoveryDays: ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: `Votre compte a été supprimé par notre équipe. Vous pouvez le récupérer dans les ${ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS} jours.`,
      data: { action: "deleted" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify account-deletion:", err.message);
  }

  return {
    id: targetUserId,
    deletedAt: new Date(),
    recoveryDays: ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS,
  };
}

async function adminRestoreUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (!targetUser.deletedAt) {
    throw new BadRequestError("Ce compte n'est pas supprimé.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { deletedAt: null, deletionReason: null },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email,
        action: "USER_RESTORED_BY_ADMIN",
        reason: reason || null,
      },
    }),
  ]);

  try {
    const emailContent = accountDeletionEmail({
      name: targetUser.name,
      action: "restored",
      actionUrl: `${env.appUrl}/account/activity`,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: "Votre compte a été restauré par notre équipe.",
      data: { action: "restored" },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify account-restored:", err.message);
  }

  return { id: targetUserId, deletedAt: null };
}

async function changeUserRole(actor, targetUserId, newRole, reason) {
  if (!VALID_ROLES.includes(newRole)) {
    throw new BadRequestError("Rôle invalide.");
  }

  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (targetUser.deletedAt) {
    throw new BadRequestError(
      "Impossible de changer le rôle d'un compte supprimé.",
    );
  }
  if (targetUser.id === actor.id) {
    throw new BadRequestError("Vous ne pouvez pas changer votre propre rôle.");
  }
  if (targetUser.role === newRole) {
    throw new BadRequestError(`L'utilisateur a déjà le rôle "${newRole}".`);
  }

  const oldRole = targetUser.role;

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    }),
    prisma.accountActionLog.create({
      data: {
        actorId: actor.id,
        actorRole: actor.role,
        targetUserId,
        targetUserEmail: targetUser.email,
        action: "USER_ROLE_CHANGED",
        reason: reason || null,
        metadata: { fromRole: oldRole, toRole: newRole },
      },
    }),
  ]);

  try {
    const emailContent = accountStatusEmail({
      name: targetUser.name,
      action: "roleChanged",
      reason: `${oldRole} → ${newRole}`,
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });

    await createNotification({
      userId: targetUserId,
      type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
      title: emailContent.subject,
      body: `Le rôle de votre compte a changé : ${oldRole} → ${newRole}.`,
      data: { action: "roleChanged", fromRole: oldRole, toRole: newRole },
      emailOverride: emailContent,
    });
  } catch (err) {
    console.error("[admin] Failed to notify role-change:", err.message);
  }

  return { id: updated.id, role: updated.role, previousRole: oldRole };
}

async function removeSecondaryEmail({ userId }) {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });

  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  const secondary = user.emails.find((e) => !e.isPrimary);
  if (!secondary) {
    throw new NotFoundError("Aucun email secondaire trouvé sur ce compte.");
  }

  await prisma.userEmail.delete({ where: { id: secondary.id } });

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true, twoFactorAuth: true },
  });

  return sanitizeUser(updated);
}

module.exports = {
  updateProfile,
  deleteAccount,
  requestAccountRecovery,
  verifyAccountRecovery,
  requestPhoneVerification,
  verifyPhone,
  requestPhoneUpdate,
  verifyPhoneUpdate,
  uploadProfilePicture,
  requestSecondaryEmail,
  verifySecondaryEmail,
  linkGoogleAccount,
  unlinkGoogleAccount,
  listUsers,
  getUserDetail,
  blockUser,
  unblockUser,
  forceLogout,
  verifyUserEmail,
  verifyUserPhone,
  adminDeleteUser,
  adminRestoreUser,
  removeSecondaryEmail,
  changeUserRole,
};
