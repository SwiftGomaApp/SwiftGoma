const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  sendOtpLoginEmail,
  sendPhoneChangedEmail,
  sendAccountDeletionEmail,
  sendAccountRecoveryOtpEmail,
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
const { maskPhone } = require("../utils/phone");

const PHONE_OTP_TTL_MINUTES = 10;
const PHONE_OTP_RESEND_COOLDOWN_SECONDS = 30;
const SECONDARY_EMAIL_OTP_TTL_MINUTES = 10;

function getPrimaryEmail(user) {
  return (user.emails || []).find((e) => e.isPrimary) || null;
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
};
