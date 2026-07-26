const crypto = require("crypto");
const { TOTP, Secret } = require("otpauth");
const QRCode = require("qrcode");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const {
  isoUint8Array,
  isoBase64URL,
} = require("@simplewebauthn/server/helpers");

const { getPrismaClient } = require("../../../config/prisma");
const { env } = require("../../../config/env");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../../config/jwt");
const {
  sendOtpLoginEmail,
  sendPasswordResetOtpEmail,
  loginDetectedEmail,
  passwordChangedEmail,
  twoFactorChangedEmail,
} = require("../../../common/emails");
const {
  parseUserAgent,
  getLocationLabel,
  formatLoginTime,
} = require("../utils/deviceInfo");
const { encryptSecret, decryptSecret } = require("../utils/totpEncryption");
const { TOTP_CONFIG } = require("../config/totp.config");
const { verifyGoogleIdToken } = require("../config/google.config");
const { WEBAUTHN_CONFIG } = require("../config/webauthn.config");
const cache = require("../../../common/services/cache");
const {
  assertAccountNotDeleted,
} = require("../../users/utils/accountDeletion");
const {
  AppError,
  ValidationError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
  TooManyRequestsError,
  UnauthorizedError,
} = require("../../../common/errors");
const {
  isValidName,
  isValidEmail,
  isValidPassword,
  generateVerificationOtp,
  generateAuthOtp,
  getOtpExpiry,
  isOtpExpired,
  hashPassword,
  comparePassword,
} = require("../utils/auth");
const {
  createNotification,
} = require("../../notification/services/notification.service");
const {
  NOTIFICATION_TYPES,
} = require("../../notification/config/notificationTypes");

const EMAIL_VERIFICATION_OTP_TTL_MINUTES = 10;
const LOGIN_OTP_TTL_MINUTES = 10;
const LOGIN_OTP_RESEND_COOLDOWN_SECONDS = 30;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

const EMAIL_SENSITIVE_FIELDS = [
  "verificationCode",
  "verificationCodeExpiresAt",
];

const PASSKEY_SENSITIVE_FIELDS = ["publicKey", "credentialId", "counter"];

function getPrimaryEmail(user) {
  return (user.emails || []).find((e) => e.isPrimary) || null;
}

function sanitizeUser(user) {
  const primaryEmail = getPrimaryEmail(user);

  const clean = { ...user };
  clean.hasPassword = Boolean(user.password);
  clean.twoFactorEnabled = Boolean(user.twoFactorAuth?.isEnabled);
  clean.email = primaryEmail ? primaryEmail.email : null;
  clean.isEmailVerified = primaryEmail ? primaryEmail.isVerified : false;
  clean.emails = (user.emails ?? []).map((e) => {
    const cleanEmail = { ...e };
    for (const field of EMAIL_SENSITIVE_FIELDS) delete cleanEmail[field];
    return cleanEmail;
  });
  clean.passkeys = (user.passkeys ?? []).map((p) => {
    const cleanPasskey = { ...p };
    for (const field of PASSKEY_SENSITIVE_FIELDS) delete cleanPasskey[field];
    return cleanPasskey;
  });

  for (const field of SENSITIVE_FIELDS) delete clean[field];
  delete clean.twoFactorAuth;

  return clean;
}

async function createAccount({ name, email, locale = "en", role }) {
  if (!isValidName(name)) {
    throw new ValidationError("Please enter a valid name.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  if (role === "ADMIN" || role === "SUPPORT") {
    throw new ValidationError(
      "This role cannot be assigned through public registration.",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();

  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmail && existingEmail.isVerified) {
    throw new ConflictError("An account with this email already exists.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(EMAIL_VERIFICATION_OTP_TTL_MINUTES);

  let user;
  if (existingEmail) {
    user = await prisma.user.update({
      where: { id: existingEmail.userId },
      data: {
        name: name.trim(),
        role,
        emails: {
          update: {
            where: { id: existingEmail.id },
            data: {
              verificationCode: code,
              verificationCodeExpiresAt: expiresAt,
            },
          },
        },
      },
      include: { emails: true, twoFactorAuth: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        role,
        emails: {
          create: {
            email: normalizedEmail,
            isPrimary: true,
            verificationCode: code,
            verificationCodeExpiresAt: expiresAt,
          },
        },
      },
      include: { emails: true, twoFactorAuth: true },
    });
  }

  await sendOtpLoginEmail(normalizedEmail, {
    name: user.name,
    code,
    expiresInMinutes: EMAIL_VERIFICATION_OTP_TTL_MINUTES,
    locale,
  });

  return sanitizeUser(user);
}

async function verifyEmail({ email, code }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the verification code.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (!userEmail) {
    throw new NotFoundError("No account found with this email.");
  }
  if (userEmail.isVerified) {
    throw new ConflictError("This email is already verified.");
  }
  if (isOtpExpired(userEmail.verificationCodeExpiresAt)) {
    throw new AppError(
      "Your verification code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (userEmail.verificationCode !== code.trim().toUpperCase()) {
    throw new AppError(
      "The verification code is incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  const verifiedUser = await prisma.user.update({
    where: { id: userEmail.userId },
    data: {
      emails: {
        update: {
          where: { id: userEmail.id },
          data: {
            isVerified: true,
            verificationCode: null,
            verificationCodeExpiresAt: null,
          },
        },
      },
    },
    include: { emails: true, twoFactorAuth: true },
  });

  return sanitizeUser(verifiedUser);
}

async function resendEmailVerification({ email, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (!userEmail) {
    throw new NotFoundError("No account found with this email.");
  }
  if (userEmail.isVerified) {
    throw new ConflictError("This email is already verified.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(EMAIL_VERIFICATION_OTP_TTL_MINUTES);

  const updated = await prisma.user.update({
    where: { id: userEmail.userId },
    data: {
      emails: {
        update: {
          where: { id: userEmail.id },
          data: {
            verificationCode: code,
            verificationCodeExpiresAt: expiresAt,
          },
        },
      },
    },
    include: { emails: true, twoFactorAuth: true },
  });

  await sendOtpLoginEmail(normalizedEmail, {
    name: updated.name,
    code,
    expiresInMinutes: EMAIL_VERIFICATION_OTP_TTL_MINUTES,
    locale,
  });

  return sanitizeUser(updated);
}

async function requestLoginOtp({ email, locale = "en" }) {
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
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(user);
  if (!userEmail.isVerified) {
    throw new AppError(
      "Please verify your email before logging in.",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }

  if (user.loginOtp && user.loginOtpExpiresAt) {
    const requestedAt = new Date(
      user.loginOtpExpiresAt.getTime() - LOGIN_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() + LOGIN_OTP_RESEND_COOLDOWN_SECONDS * 1000,
    );
    const now = new Date();
    if (cooldownEndsAt > now) {
      const secondsLeft = Math.ceil((cooldownEndsAt - now) / 1000);
      throw new TooManyRequestsError(
        `Please wait ${secondsLeft} seconds before requesting another code.`,
      );
    }
  }

  const code = generateAuthOtp();
  const expiresAt = getOtpExpiry(LOGIN_OTP_TTL_MINUTES);

  await prisma.user.update({
    where: { id: user.id },
    data: { loginOtp: code, loginOtpExpiresAt: expiresAt },
  });

  await sendOtpLoginEmail(normalizedEmail, {
    name: user.name,
    code,
    expiresInMinutes: LOGIN_OTP_TTL_MINUTES,
    locale,
  });

  return { message: "A login code has been sent to your email." };
}

async function issueSessionAndNotify(
  user,
  { userAgent, ipAddress, deviceName, locale = "en" } = {},
) {
  const prisma = getPrismaClient();
  const sessionExpiresAt = new Date(
    Date.now() + env.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  );

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: crypto.randomUUID(),
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      deviceName: deviceName || null,
      expiresAt: sessionExpiresAt,
    },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    sessionId: session.id,
  });

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  const primaryEmail = getPrimaryEmail(user);

  if (primaryEmail) {
    try {
      const { browser, device } = parseUserAgent(userAgent);
      const emailContent = loginDetectedEmail({
        name: user.name,
        email: primaryEmail.email,
        location: getLocationLabel(ipAddress),
        time: formatLoginTime(locale),
        browser,
        device,
        ip: ipAddress || "Unknown",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId: user.id,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: `Nouvelle connexion détectée depuis ${device || "un appareil"} (${browser || "navigateur inconnu"}).`,
        data: { action: "loginDetected", ip: ipAddress || null },
        emailOverride: emailContent,
      });
    } catch (err) {
      console.error("[auth] Failed to notify login-detected:", err.message);
    }
  } else {
    console.error(
      `[auth] issueSessionAndNotify: no primary email found for user ${user.id} — was "emails" included in the query?`,
    );
  }

  return { accessToken, refreshToken, sessionId: session.id };
}

async function verifyLoginOtp({
  email,
  code,
  userAgent,
  ipAddress,
  deviceName,
}) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter the login code.");
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
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(user);
  if (isOtpExpired(user.loginOtpExpiresAt)) {
    throw new AppError(
      "Your login code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (user.loginOtp !== code.trim().toUpperCase()) {
    throw new AppError("The login code is incorrect.", 422, "OTP_INVALID");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { loginOtp: null, loginOtpExpiresAt: null },
  });

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

async function loginWithPassword({
  email,
  password,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!password || typeof password !== "string") {
    throw new ValidationError("Please enter your password.");
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
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(user);
  if (!userEmail.isVerified) {
    throw new AppError(
      "Please verify your email before logging in.",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }
  if (!user.password) {
    throw new AppError(
      "This account doesn't have a password set. Log in with an email code instead.",
      409,
      "NO_PASSWORD_SET",
    );
  }

  const matches = await comparePassword(password, user.password);
  if (!matches) {
    throw new UnauthorizedError("Incorrect email or password.");
  }

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return { requiresTotp: true, userId: user.id };
  }

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

async function refreshAccessToken({ refreshToken }) {
  if (!refreshToken) {
    throw new UnauthorizedError("No refresh token provided.");
  }

  const claims = verifyRefreshToken(refreshToken);

  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({
    where: { id: claims.sessionId },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again.",
    );
  }

  if (hashToken(refreshToken) !== session.refreshTokenHash) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { emails: true, twoFactorAuth: true },
  });
  if (!user) {
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

  const newAccessToken = signAccessToken({
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });
  const newRefreshToken = signRefreshToken({
    userId: user.id,
    sessionId: session.id,
  });

  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(newRefreshToken),
      lastUsedAt: new Date(),
    },
  });

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function getCurrentUser(userId) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true, twoFactorAuth: true },
  });

  if (!user) {
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

  return sanitizeUser(user);
}

async function logout(sessionId) {
  const prisma = getPrismaClient();
  await prisma.session.updateMany({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
  return { message: "Logged out successfully." };
}

async function logoutAll(userId, { exceptSessionId } = {}) {
  const prisma = getPrismaClient();
  await prisma.session.updateMany({
    where: {
      userId,
      isRevoked: false,
      ...(exceptSessionId && { id: { not: exceptSessionId } }),
    },
    data: { isRevoked: true },
  });
  return { message: "Logged out of all devices." };
}

const PASSWORD_RESET_OTP_TTL_MINUTES = 15;
const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 30;

async function createPassword({ userId, password, locale = "en" }) {
  if (!isValidPassword(password)) {
    throw new ValidationError("Password must be at least 8 characters.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (user.password) {
    throw new ConflictError(
      "A password is already set for this account. Use update password instead.",
    );
  }

  const passwordHash = await hashPassword(password);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
    include: { emails: true, twoFactorAuth: true },
  });

  try {
    const primaryEmail = getPrimaryEmail(updated);
    if (primaryEmail) {
      const emailContent = passwordChangedEmail({
        name: updated.name,
        action: "created",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId: updated.id,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "Un mot de passe a été créé pour votre compte.",
        data: { action: "passwordCreated" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error("[auth] Failed to notify password-created:", err.message);
  }

  return sanitizeUser(updated);
}

async function updatePassword({
  userId,
  currentSessionId,
  currentPassword,
  newPassword,
  locale = "en",
}) {
  if (!isValidPassword(newPassword)) {
    throw new ValidationError("New password must be at least 8 characters.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  if (!user.password) {
    throw new ConflictError(
      "No password is set for this account. Use create password instead.",
    );
  }

  const matches = await comparePassword(currentPassword || "", user.password);
  if (!matches) {
    throw new UnauthorizedError("Current password is incorrect.");
  }
  if (currentPassword === newPassword) {
    throw new ValidationError(
      "New password must be different from the current password.",
    );
  }

  const passwordHash = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
    include: { emails: true, twoFactorAuth: true },
  });

  try {
    const primaryEmail = getPrimaryEmail(updated);
    if (primaryEmail) {
      const emailContent = passwordChangedEmail({
        name: updated.name,
        action: "updated",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId: updated.id,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "Votre mot de passe a été modifié.",
        data: { action: "passwordUpdated" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error("[auth] Failed to notify password-updated:", err.message);
  }

  await logoutAll(userId, { exceptSessionId: currentSessionId });

  return sanitizeUser(updated);
}

async function forgotPassword({ email, locale = "en" }) {
  const GENERIC_RESPONSE = {
    message:
      "If an account with that email exists, a password reset code has been sent.",
  };

  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  if (!userEmail || userEmail.user.isBlocked || userEmail.user.deletedAt) {
    return GENERIC_RESPONSE;
  }
  const user = userEmail.user;

  if (user.passwordResetCode && user.passwordResetCodeExpiresAt) {
    const requestedAt = new Date(
      user.passwordResetCodeExpiresAt.getTime() -
        PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() + PASSWORD_RESET_RESEND_COOLDOWN_SECONDS * 1000,
    );
    if (cooldownEndsAt > new Date()) {
      return GENERIC_RESPONSE;
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(PASSWORD_RESET_OTP_TTL_MINUTES);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetCode: code, passwordResetCodeExpiresAt: expiresAt },
  });

  await sendPasswordResetOtpEmail(normalizedEmail, {
    name: user.name,
    code,
    expiresInMinutes: PASSWORD_RESET_OTP_TTL_MINUTES,
    locale,
  });

  return GENERIC_RESPONSE;
}

async function resetPassword({ email, code, newPassword, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!isValidPassword(newPassword)) {
    throw new ValidationError("Password must be at least 8 characters.");
  }

  const INVALID_CODE_ERROR = new AppError(
    "This reset code is invalid or has expired.",
    422,
    "RESET_CODE_INVALID",
  );

  if (!code || typeof code !== "string" || !code.trim()) {
    throw INVALID_CODE_ERROR;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  if (
    !userEmail ||
    isOtpExpired(userEmail.user.passwordResetCodeExpiresAt) ||
    userEmail.user.passwordResetCode !== code.trim().toUpperCase()
  ) {
    throw INVALID_CODE_ERROR;
  }
  const user = userEmail.user;
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

  const passwordHash = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetCode: null,
      passwordResetCodeExpiresAt: null,
    },
    include: { emails: true, twoFactorAuth: true },
  });

  await logoutAll(user.id);

  try {
    const primaryEmail = getPrimaryEmail(updated);
    if (primaryEmail) {
      const emailContent = passwordChangedEmail({
        name: updated.name,
        action: "reset",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId: updated.id,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "Votre mot de passe a été réinitialisé.",
        data: { action: "passwordReset" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error("[auth] Failed to notify password-reset:", err.message);
  }

  return sanitizeUser(updated);
}

function buildTotp(email, secret) {
  return new TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: email,
    algorithm: TOTP_CONFIG.algorithm,
    digits: TOTP_CONFIG.digits,
    period: TOTP_CONFIG.period,
    secret,
  });
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < TOTP_CONFIG.backupCodeCount; i++) {
    codes.push(
      crypto
        .randomBytes(TOTP_CONFIG.backupCodeLength)
        .toString("hex")
        .slice(0, TOTP_CONFIG.backupCodeLength)
        .toUpperCase(),
    );
  }
  return codes;
}

async function verifyTotpOrBackupCode(prisma, twoFactorRecord, code) {
  const trimmedCode = (code || "").trim();
  if (!trimmedCode) return false;

  const secret = Secret.fromBase32(decryptSecret(twoFactorRecord.secret));
  const totp = buildTotp("", secret);
  const delta = totp.validate({
    token: trimmedCode,
    window: TOTP_CONFIG.verificationWindow,
  });
  if (delta !== null) return true;

  const codeHash = hashToken(trimmedCode.toUpperCase());
  const backupCode = await prisma.twoFactorBackupCode.findFirst({
    where: { twoFactorId: twoFactorRecord.id, codeHash, isUsed: false },
  });
  if (backupCode) {
    await prisma.twoFactorBackupCode.update({
      where: { id: backupCode.id },
      data: { isUsed: true, usedAt: new Date() },
    });
    return true;
  }

  return false;
}

async function setupTotp({ userId }) {
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });

  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const existing = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  if (existing && existing.isEnabled) {
    throw new ConflictError(
      "Two-factor authentication is already enabled for this account.",
    );
  }

  const secret = new Secret();
  const primaryEmail = getPrimaryEmail(user);
  const totp = buildTotp(primaryEmail ? primaryEmail.email : "", secret);
  const encryptedSecret = encryptSecret(secret.base32);

  if (existing) {
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { secret: encryptedSecret },
    });
  } else {
    await prisma.twoFactorAuth.create({
      data: { userId, secret: encryptedSecret },
    });
  }

  const qrCodeDataUrl = await QRCode.toDataURL(totp.toString());

  return { qrCodeDataUrl, manualEntryKey: secret.base32 };
}

async function confirmTotp({ userId, code, locale = "en" }) {
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError(
      "Please enter the code from your authenticator app.",
    );
  }

  const prisma = getPrismaClient();
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });

  if (!record) {
    throw new NotFoundError(
      "No two-factor setup in progress. Start setup first.",
    );
  }
  if (record.isEnabled) {
    throw new ConflictError("Two-factor authentication is already enabled.");
  }

  const secret = Secret.fromBase32(decryptSecret(record.secret));
  const totp = buildTotp("", secret);
  const delta = totp.validate({
    token: code.trim(),
    window: TOTP_CONFIG.verificationWindow,
  });

  if (delta === null) {
    throw new AppError("Invalid verification code.", 422, "TOTP_INVALID");
  }

  const backupCodes = generateBackupCodes();

  await prisma.$transaction([
    prisma.twoFactorAuth.update({
      where: { userId },
      data: { isEnabled: true },
    }),
    prisma.twoFactorBackupCode.createMany({
      data: backupCodes.map((plainCode) => ({
        twoFactorId: record.id,
        codeHash: hashToken(plainCode),
      })),
    }),
  ]);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { emails: true },
    });
    const primaryEmail = getPrimaryEmail(user);
    if (primaryEmail) {
      const emailContent = twoFactorChangedEmail({
        name: user.name,
        action: "enabled",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "L'authentification à deux facteurs a été activée sur votre compte.",
        data: { action: "twoFactorEnabled" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error("[auth] Failed to notify 2FA-enabled:", err.message);
  }

  return { backupCodes };
}

async function disableTotp({ userId, code, locale = "en" }) {
  const prisma = getPrismaClient();
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });

  if (!record || !record.isEnabled) {
    throw new NotFoundError(
      "Two-factor authentication is not enabled for this account.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Invalid verification code.", 422, "TOTP_INVALID");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  await prisma.twoFactorAuth.delete({ where: { userId } });

  try {
    const primaryEmail = getPrimaryEmail(user);
    if (primaryEmail) {
      const emailContent = twoFactorChangedEmail({
        name: user.name,
        action: "disabled",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "L'authentification à deux facteurs a été désactivée sur votre compte.",
        data: { action: "twoFactorDisabled" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error("[auth] Failed to notify 2FA-disabled:", err.message);
  }

  return { message: "Two-factor authentication has been disabled." };
}

async function loginWithTotp({
  userId,
  code,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  if (!userId) {
    throw new ValidationError("Missing login session. Please log in again.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Please enter your two-factor code.");
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true, twoFactorAuth: true },
  });

  if (!user) {
    throw new UnauthorizedError(
      "Invalid or expired session. Please log in again.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

  const record = user.twoFactorAuth;
  if (!record || !record.isEnabled) {
    throw new ConflictError(
      "Two-factor authentication is not enabled for this account.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Invalid two-factor code.", 422, "TOTP_INVALID");
  }

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

async function regenerateBackupCodes({ userId, code, locale = "en" }) {
  const prisma = getPrismaClient();
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });

  if (!record || !record.isEnabled) {
    throw new NotFoundError(
      "Two-factor authentication is not enabled for this account.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Invalid verification code.", 422, "TOTP_INVALID");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true },
  });
  const backupCodes = generateBackupCodes();

  await prisma.$transaction([
    prisma.twoFactorBackupCode.deleteMany({
      where: { twoFactorId: record.id },
    }),
    prisma.twoFactorBackupCode.createMany({
      data: backupCodes.map((plainCode) => ({
        twoFactorId: record.id,
        codeHash: hashToken(plainCode),
      })),
    }),
  ]);

  try {
    const primaryEmail = getPrimaryEmail(user);
    if (primaryEmail) {
      const emailContent = twoFactorChangedEmail({
        name: user.name,
        action: "backup_codes_regenerated",
        reviewActivityUrl: `${env.appUrl}/account/activity`,
        locale,
      });

      await createNotification({
        userId,
        type: NOTIFICATION_TYPES.ACCOUNT_SECURITY,
        title: emailContent.subject,
        body: "De nouveaux codes de secours ont été générés pour votre compte.",
        data: { action: "backupCodesRegenerated" },
        emailOverride: emailContent,
      });
    }
  } catch (err) {
    console.error(
      "[auth] Failed to notify backup-codes-regenerated:",
      err.message,
    );
  }

  return { backupCodes };
}

async function registerWithGoogle({
  idToken,
  role,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  const profile = await verifyGoogleIdToken(idToken);
  const prisma = getPrismaClient();

  const existingByGoogleId = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogleId) {
    throw new ConflictError(
      "An account is already linked to this Google account. Please log in instead.",
    );
  }

  const normalizedEmail = profile.email.trim().toLowerCase();
  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new AppError(
      "An account with this email already exists. Log in and link your Google account from settings.",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      role,
      emails: {
        create: {
          email: normalizedEmail,
          isPrimary: true,
          isVerified: profile.emailVerified,
        },
      },
    },
    include: { emails: true, twoFactorAuth: true },
  });

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

async function loginWithGoogle({
  idToken,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  const profile = await verifyGoogleIdToken(idToken);
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
    include: { emails: true, twoFactorAuth: true },
  });

  if (!user) {
    const normalizedEmail = profile.email.trim().toLowerCase();
    const existingEmail = await prisma.userEmail.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      throw new AppError(
        "This email is registered but not linked to Google yet. Log in another way and link your Google account from settings.",
        409,
        "GOOGLE_NOT_LINKED",
      );
    }
    throw new NotFoundError(
      "No account found for this Google account. Please register first.",
    );
  }

  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(user);

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return { requiresTotp: true, userId: user.id };
  }

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

const WEBAUTHN_CHALLENGE_TTL_SECONDS = Math.floor(
  WEBAUTHN_CONFIG.timeoutMs / 1000,
);

function passkeyRegChallengeKey(userId) {
  return `webauthn:reg:${userId}`;
}

function passkeyAuthChallengeKey(email) {
  return `webauthn:auth:${email}`;
}

async function generatePasskeyRegistrationOptions({ userId }) {
  if (!cache.isAvailable()) {
    throw new AppError(
      "Passkey setup is temporarily unavailable.",
      503,
      "WEBAUTHN_UNAVAILABLE",
    );
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeys: true, emails: true },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }
  const primaryEmail = getPrimaryEmail(user);

  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_CONFIG.rpName,
    rpID: WEBAUTHN_CONFIG.rpID,
    userName: primaryEmail ? primaryEmail.email : user.id,
    userID: isoUint8Array.fromUTF8String(user.id),
    userDisplayName: user.name,
    timeout: WEBAUTHN_CONFIG.timeoutMs,
    attestationType: "none",
    excludeCredentials: user.passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports ? p.transports.split(",") : undefined,
    })),
    authenticatorSelection: {
      residentKey: WEBAUTHN_CONFIG.residentKey,
      userVerification: WEBAUTHN_CONFIG.userVerification,
    },
  });

  await cache.set(
    passkeyRegChallengeKey(userId),
    options.challenge,
    WEBAUTHN_CHALLENGE_TTL_SECONDS,
  );

  return options;
}

async function verifyPasskeyRegistration({ userId, response, deviceName }) {
  const expectedChallenge = await cache.get(passkeyRegChallengeKey(userId));
  if (!expectedChallenge) {
    throw new AppError(
      "Registration challenge expired. Please try again.",
      422,
      "WEBAUTHN_CHALLENGE_EXPIRED",
    );
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.expectedOrigins,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
    });
  } catch (err) {
    throw new AppError(
      "Could not verify passkey registration.",
      422,
      "WEBAUTHN_VERIFICATION_FAILED",
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(
      "Could not verify passkey registration.",
      422,
      "WEBAUTHN_VERIFICATION_FAILED",
    );
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;
  const prisma = getPrismaClient();

  let passkey;
  try {
    passkey = await prisma.passkey.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: isoBase64URL.fromBuffer(credential.publicKey),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports
          ? credential.transports.join(",")
          : null,
        deviceName: deviceName || null,
      },
    });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ConflictError("This passkey is already registered.");
    }
    throw err;
  }

  await cache.del(passkeyRegChallengeKey(userId));

  return {
    id: passkey.id,
    deviceName: passkey.deviceName,
    createdAt: passkey.createdAt,
  };
}

async function generatePasskeyLoginOptions({ email }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }
  if (!cache.isAvailable()) {
    throw new AppError(
      "Passkey login is temporarily unavailable.",
      503,
      "WEBAUTHN_UNAVAILABLE",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: { include: { passkeys: true } } },
  });

  if (!userEmail || userEmail.user.passkeys.length === 0) {
    throw new NotFoundError("No passkeys found for this account.");
  }
  const user = userEmail.user;
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(user);

  const options = await generateAuthenticationOptions({
    rpID: WEBAUTHN_CONFIG.rpID,
    allowCredentials: user.passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports ? p.transports.split(",") : undefined,
    })),
    timeout: WEBAUTHN_CONFIG.timeoutMs,
    userVerification: WEBAUTHN_CONFIG.userVerification,
  });

  await cache.set(
    passkeyAuthChallengeKey(normalizedEmail),
    options.challenge,
    WEBAUTHN_CHALLENGE_TTL_SECONDS,
  );

  return options;
}

async function verifyPasskeyLogin({
  email,
  response,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expectedChallenge = await cache.get(
    passkeyAuthChallengeKey(normalizedEmail),
  );
  if (!expectedChallenge) {
    throw new AppError(
      "Login challenge expired. Please try again.",
      422,
      "WEBAUTHN_CHALLENGE_EXPIRED",
    );
  }

  const prisma = getPrismaClient();
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
    include: { user: { include: { emails: true, twoFactorAuth: true } } },
  });

  const matchesEmail =
    passkey && passkey.user.emails.some((e) => e.email === normalizedEmail);
  if (!matchesEmail) {
    throw new UnauthorizedError("Passkey not recognized.");
  }
  if (passkey.user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  assertAccountNotDeleted(passkey.user);

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: WEBAUTHN_CONFIG.expectedOrigins,
      expectedRPID: WEBAUTHN_CONFIG.rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports
          ? passkey.transports.split(",")
          : undefined,
      },
    });
  } catch (err) {
    throw new UnauthorizedError("Could not verify passkey login.");
  }

  if (!verification.verified) {
    throw new UnauthorizedError("Could not verify passkey login.");
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  await cache.del(passkeyAuthChallengeKey(normalizedEmail));

  const user = passkey.user;

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return { requiresTotp: true, userId: user.id };
  }

  const { accessToken, refreshToken, sessionId } = await issueSessionAndNotify(
    user,
    {
      userAgent,
      ipAddress,
      deviceName,
      locale,
    },
  );

  return { user: sanitizeUser(user), accessToken, refreshToken, sessionId };
}

async function listPasskeys({ userId }) {
  const prisma = getPrismaClient();
  const passkeys = await prisma.passkey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return passkeys.map((pk) => ({
    id: pk.id,
    deviceName: pk.deviceName,
    deviceType: pk.deviceType,
    backedUp: pk.backedUp,
    transports: pk.transports ? pk.transports.split(",") : [],
    lastUsedAt: pk.lastUsedAt,
    createdAt: pk.createdAt,
  }));
}

async function deletePasskey({ userId, passkeyId }) {
  const prisma = getPrismaClient();
  const passkey = await prisma.passkey.findUnique({ where: { id: passkeyId } });

  if (!passkey || passkey.userId !== userId) {
    throw new NotFoundError("Passkey not found.");
  }

  await prisma.passkey.delete({ where: { id: passkeyId } });

  return { message: "Passkey removed." };
}

module.exports = {
  createAccount,
  verifyEmail,
  resendEmailVerification,
  requestLoginOtp,
  verifyLoginOtp,
  loginWithPassword,
  refreshAccessToken,
  getCurrentUser,
  logout,
  logoutAll,
  createPassword,
  updatePassword,
  forgotPassword,
  resetPassword,
  setupTotp,
  confirmTotp,
  disableTotp,
  loginWithTotp,
  regenerateBackupCodes,
  registerWithGoogle,
  loginWithGoogle,
  generatePasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  generatePasskeyLoginOptions,
  verifyPasskeyLogin,
  listPasskeys,
  deletePasskey,
  issueSessionAndNotify,
  sanitizeUser,
};
