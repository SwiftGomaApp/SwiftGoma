const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  sendOtpLoginEmail,
  sendPhoneChangedEmail,
  sendAccountDeletionEmail,
  sendAccountRecoveryOtpEmail,
  sendAccountStatusEmail,
  sendSessionsRevokedEmail,
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
      "You cannot perform this action on your own account.",
    );
  }
  if (actor.role === "SUPPORT" && PRIVILEGED_ROLES.includes(targetUser.role)) {
    throw new ForbiddenError(
      "SUPPORT cannot act on ADMIN or SUPPORT accounts.",
    );
  }
}

async function getTargetUserOrThrow(targetUserId) {
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { emails: { where: { isPrimary: true }, take: 1 } },
  });
  if (!targetUser) throw new NotFoundError("User not found.");
  return { ...targetUser, email: targetUser.emails[0]?.email ?? "" };
}

async function updateProfile({ userId, name, avatarUrl }) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const data = {};

  if (name !== undefined) {
    if (!isValidName(name)) {
      throw new ValidationError("Please enter a valid name.");
    }
    data.name = name.trim();
  }

  if (avatarUrl !== undefined) {
    data.avatarUrl = avatarUrl;
  }

  if (Object.keys(data).length === 0) {
    throw new ValidationError("Nothing to update.");
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
    throw new NotFoundError("Account not found.");
  }
  if (user.deletedAt) {
    throw new ConflictError("This account is already deleted.");
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
      "Your account has been deleted. You can recover it within " +
      ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS +
      " days.",
  };
}

async function requestAccountRecovery({ email, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  if (!userEmail) {
    throw new NotFoundError("No account found with this email.");
  }
  const user = userEmail.user;
  if (!user.deletedAt) {
    throw new ConflictError("This account is not deleted.");
  }
  if (!isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new NotFoundError("No account found with this email.");
  }

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
      const secondsLeft = Math.ceil((cooldownEndsAt - now) / 1000);
      throw new TooManyRequestsError(
        "Please wait " +
          secondsLeft +
          " seconds before requesting another code.",
      );
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

  return { message: "A recovery code has been sent to your email." };
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
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the recovery code.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: { include: { emails: true, twoFactorAuth: true } } },
  });

  if (!userEmail) {
    throw new NotFoundError("No account found with this email.");
  }
  const user = userEmail.user;
  if (!user.deletedAt || !isWithinRecoveryGracePeriod(user.deletedAt)) {
    throw new NotFoundError("No account found with this email.");
  }
  if (isOtpExpired(user.accountRecoveryCodeExpiresAt)) {
    throw new AppError(
      "Your recovery code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (user.accountRecoveryCode !== code.trim().toUpperCase()) {
    throw new AppError("The recovery code is incorrect.", 422, "OTP_INVALID");
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
    throw new ValidationError("Please enter a valid phone number.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (user.isPhoneVerified) {
    throw new ConflictError(
      "This account already has a verified phone number. Use phone update to change it.",
    );
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phone, id: { not: userId } },
  });
  if (existingPhone) {
    throw new ConflictError("This phone number is already in use.");
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
        "Please wait " +
          secondsLeft +
          " seconds before requesting another code.",
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
        " is your Swiftgoma verification code. It expires in " +
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
      "We couldn't send the verification code. Please try again in a moment.",
      502,
      "SMS_SEND_FAILED",
    );
  }

  return { message: "A verification code has been sent to your phone." };
}

async function verifyPhone({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the verification code.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (!user.phone || !user.phoneVerificationCode) {
    throw new ConflictError(
      "No phone verification in progress. Start verification first.",
    );
  }
  if (isOtpExpired(user.phoneVerificationCodeExpiresAt)) {
    throw new AppError(
      "Your verification code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (user.phoneVerificationCode !== code.trim().toUpperCase()) {
    throw new AppError(
      "The verification code is incorrect.",
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
    throw new NotFoundError("Account not found.");
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
    throw new ValidationError("Please enter a valid phone number.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (!user.isPhoneVerified) {
    throw new ConflictError(
      "No verified phone number on this account yet. Use phone verification to add one first.",
    );
  }
  if (user.phone === newPhone) {
    throw new ConflictError("This is already your current phone number.");
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phone: newPhone, id: { not: userId } },
  });
  if (existingPhone) {
    throw new ConflictError("This phone number is already in use.");
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
        "Please wait " +
          secondsLeft +
          " seconds before requesting another code.",
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
        " is your Swiftgoma verification code. It expires in " +
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
      "We couldn't send the verification code. Please try again in a moment.",
      502,
      "SMS_SEND_FAILED",
    );
  }

  return {
    message: "A verification code has been sent to your new phone number.",
  };
}

async function verifyPhoneUpdate({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the verification code.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (!user.pendingPhone || !user.phoneVerificationCode) {
    throw new ConflictError(
      "No phone update in progress. Start an update first.",
    );
  }
  if (isOtpExpired(user.phoneVerificationCodeExpiresAt)) {
    throw new AppError(
      "Your verification code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (user.phoneVerificationCode !== code.trim().toUpperCase()) {
    throw new AppError(
      "The verification code is incorrect.",
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
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const primaryEmail = getPrimaryEmail(user);
  if (primaryEmail && primaryEmail.email === normalizedEmail) {
    throw new ConflictError("This is already your primary email.");
  }

  const existingSecondary = user.emails.find((e) => !e.isPrimary);
  if (existingSecondary && existingSecondary.isVerified) {
    throw new ConflictError(
      "This account already has a verified secondary email. Remove it before adding another.",
    );
  }

  const existingElsewhere = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingElsewhere && existingElsewhere.userId !== userId) {
    throw new ConflictError("This email is already in use.");
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

  return { message: "A verification code has been sent to your new email." };
}

async function verifySecondaryEmail({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the verification code.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const pending = user.emails.find(
    (e) => !e.isPrimary && !e.isVerified && e.verificationCode,
  );
  if (!pending) {
    throw new ConflictError(
      "No secondary email verification in progress. Start one first.",
    );
  }
  if (isOtpExpired(pending.verificationCodeExpiresAt)) {
    throw new AppError(
      "Your verification code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (pending.verificationCode !== code.trim().toUpperCase()) {
    throw new AppError(
      "The verification code is incorrect.",
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

  if (!user) throw new NotFoundError("Account not found.");
  if (user.deletedAt) throw new BadRequestError("This account is deleted.");
  if (user.googleId)
    throw new ConflictError("A Google account is already linked.");

  const payload = await verifyGoogleIdToken(idToken);
  if (!payload?.sub) throw new UnauthorizedError("Invalid Google token.");

  const existing = await prisma.user.findUnique({
    where: { googleId: payload.sub },
  });
  if (existing) {
    throw new ConflictError(
      "This Google account is already linked to another user.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleId: payload.sub },
  });

  return { message: "Compte Google lié avec succès.", googleLinked: true };
}

async function unlinkGoogleAccount(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: { where: { isPrimary: true }, take: 1 } },
  });

  if (!user) throw new NotFoundError("Account not found.");
  if (!user.googleId) throw new BadRequestError("No Google account is linked.");

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

// =============================  ADMIN / SUPPORT ACTIONS ON USER ================================================

async function listUsers(query) {
  const { page, limit, skip } = parsePagination(query);
  const { role, status, search } = query;

  const prisma = getPrismaClient();

  if (
    role &&
    !["BUYER", "SELLER", "RIDER", "ADMIN", "SUPPORT"].includes(role)
  ) {
    throw new BadRequestError("Invalid role filter.");
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

  if (!user) throw new NotFoundError("User not found.");

  const clean = { ...user };
  for (const field of SENSITIVE_FIELDS) delete clean[field];
  return clean;
}

async function blockUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);
  if (targetUser.deletedAt)
    throw new BadRequestError("Cannot block a deleted account.");
  if (targetUser.isBlocked)
    throw new BadRequestError("User is already blocked.");

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
    await sendAccountStatusEmail(targetUser.email, {
      name: targetUser.name,
      action: "blocked",
      reason,
      actionUrl: `mailto:${require("../../../common/constants/brand").BRAND.supportEmail}`,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send account-blocked notification:",
      err.message,
    );
  }

  return { id: updated.id, isBlocked: updated.isBlocked };
}

async function unblockUser(actor, targetUserId, reason) {
  const targetUser = await getTargetUserOrThrow(targetUserId);
  if (!targetUser.isBlocked) throw new BadRequestError("User is not blocked.");

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
    await sendAccountStatusEmail(targetUser.email, {
      name: targetUser.name,
      action: "unblocked",
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send account-unblocked notification:",
      err.message,
    );
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
    throw new NotFoundError("Session not found or already revoked.");
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
    await sendSessionsRevokedEmail(targetUser.email, {
      name: targetUser.name,
      scope: sessionId ? "single" : "all",
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send sessions-revoked notification:",
      err.message,
    );
  }

  return { revokedCount: result.count };
}

async function verifyUserEmail(actor, targetUserId, emailId) {
  const targetUser = await getTargetUserOrThrow(targetUserId);

  const userEmail = await prisma.userEmail.findFirst({
    where: { id: emailId, userId: targetUserId },
  });
  if (!userEmail) throw new NotFoundError("Email not found for this user.");
  if (userEmail.isVerified) {
    throw new BadRequestError("Email is already verified.");
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
    throw new BadRequestError("This user has no phone number on file.");
  if (targetUser.isPhoneVerified) {
    throw new BadRequestError("Phone is already verified.");
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
    throw new BadRequestError("This account is already deleted.");
  }
  if (targetUser.id === actor.id) {
    throw new BadRequestError("You cannot delete your own account this way.");
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
    await sendAccountDeletionEmail(targetUser.email, {
      name: targetUser.name,
      action: "deleted",
      actionUrl: `${env.appUrl}/account/recovery`,
      recoveryDays: ACCOUNT_DELETION_CONFIG.RECOVERY_GRACE_PERIOD_DAYS,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send account-deletion notification:",
      err.message,
    );
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
    throw new BadRequestError("This account is not deleted.");
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
    await sendAccountDeletionEmail(targetUser.email, {
      name: targetUser.name,
      action: "restored",
      actionUrl: `${env.appUrl}/account/activity`,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send account-restored notification:",
      err.message,
    );
  }

  return { id: targetUserId, deletedAt: null };
}

async function changeUserRole(actor, targetUserId, newRole, reason) {
  if (!VALID_ROLES.includes(newRole)) {
    throw new BadRequestError("Invalid role.");
  }

  const targetUser = await getTargetUserOrThrow(targetUserId);

  if (targetUser.deletedAt) {
    throw new BadRequestError("Cannot change the role of a deleted account.");
  }
  if (targetUser.id === actor.id) {
    throw new BadRequestError("You cannot change your own role.");
  }
  if (targetUser.role === newRole) {
    throw new BadRequestError(`User already has the role "${newRole}".`);
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
    await sendAccountStatusEmail(targetUser.email, {
      name: targetUser.name,
      action: "roleChanged",
      reason: `${oldRole} → ${newRole}`,
      actionUrl: `${env.appUrl}/login`,
      locale: "fr",
    });
  } catch (err) {
    console.error(
      "[admin] Failed to send role-change notification:",
      err.message,
    );
  }

  return { id: updated.id, role: updated.role, previousRole: oldRole };
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
  changeUserRole,
};
