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
  sendLoginDetectedEmail,
  sendPasswordResetOtpEmail,
  sendPasswordChangedEmail,
  sendTwoFactorChangedEmail,
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

const EMAIL_VERIFICATION_OTP_TTL_MINUTES = 10;
const LOGIN_OTP_TTL_MINUTES = 10;
const LOGIN_OTP_RESEND_COOLDOWN_SECONDS = 30;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Every function below that returns a user for the client MUST include
// the twoFactorAuth relation on its query (include: { twoFactorAuth: true })
// — sanitizeUser() can only compute twoFactorEnabled from data that's
// actually present on the object it receives. Forgetting the include
// doesn't error, it just silently reports twoFactorEnabled: false.
const SENSITIVE_FIELDS = [
  "password",
  "emailVerificationCode",
  "emailVerificationCodeExpiresAt",
  "phoneVerificationCode",
  "phoneVerificationCodeExpiresAt",
  "loginOtp",
  "loginOtpExpiresAt",
  "passwordResetCode",
  "passwordResetCodeExpiresAt",
];

function sanitizeUser(user) {
  const clean = { ...user };
  clean.hasPassword = Boolean(user.password);
  clean.twoFactorEnabled = Boolean(user.twoFactorAuth?.isEnabled);
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

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existing && existing.isEmailVerified) {
    throw new ConflictError("An account with this email already exists.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(EMAIL_VERIFICATION_OTP_TTL_MINUTES);

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: name.trim(),
        role,
        emailVerificationCode: code,
        emailVerificationCodeExpiresAt: expiresAt,
      },
      include: { twoFactorAuth: true },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        role,
        emailVerificationCode: code,
        emailVerificationCodeExpiresAt: expiresAt,
      },
      include: { twoFactorAuth: true },
    });
  }

  await sendOtpLoginEmail(user.email, {
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email.");
  }
  if (user.isEmailVerified) {
    throw new ConflictError("This email is already verified.");
  }
  if (isOtpExpired(user.emailVerificationCodeExpiresAt)) {
    throw new AppError(
      "Your verification code has expired. Request a new one.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (user.emailVerificationCode !== code.trim().toUpperCase()) {
    throw new AppError(
      "The verification code is incorrect.",
      422,
      "OTP_INVALID",
    );
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationCodeExpiresAt: null,
    },
    include: { twoFactorAuth: true },
  });

  return sanitizeUser(verifiedUser);
}

async function resendEmailVerification({ email, locale = "en" }) {
  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email address.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email.");
  }
  if (user.isEmailVerified) {
    throw new ConflictError("This email is already verified.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(EMAIL_VERIFICATION_OTP_TTL_MINUTES);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCode: code,
      emailVerificationCodeExpiresAt: expiresAt,
    },
    include: { twoFactorAuth: true },
  });

  await sendOtpLoginEmail(updated.email, {
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email.");
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  if (!user.isEmailVerified) {
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

  await sendOtpLoginEmail(user.email, {
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

  try {
    const { browser, device } = parseUserAgent(userAgent);
    await sendLoginDetectedEmail(user.email, {
      name: user.name,
      email: user.email,
      location: getLocationLabel(ipAddress),
      time: formatLoginTime(locale),
      browser,
      device,
      ip: ipAddress || "Unknown",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error("[auth] Failed to send login-detected email:", err.message);
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    include: { twoFactorAuth: true },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email.");
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    include: { twoFactorAuth: true },
  });

  if (!user) {
    throw new NotFoundError("No account found with this email.");
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }
  if (!user.isEmailVerified) {
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

  // Reusing the included relation instead of a separate
  // prisma.twoFactorAuth.findUnique() call — one less query, since the
  // user fetch above already brought this along.
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
    include: { twoFactorAuth: true },
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
    include: { twoFactorAuth: true },
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
    include: { twoFactorAuth: true },
  });

  try {
    await sendPasswordChangedEmail(updated.email, {
      name: updated.name,
      action: "created",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error(
      "[auth] Failed to send password-created notification:",
      err.message,
    );
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
    include: { twoFactorAuth: true },
  });

  try {
    await sendPasswordChangedEmail(updated.email, {
      name: updated.name,
      action: "updated",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error(
      "[auth] Failed to send password-updated notification:",
      err.message,
    );
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (!user || user.isBlocked) {
    return GENERIC_RESPONSE;
  }

  if (user.passwordResetCode && user.passwordResetCodeExpiresAt) {
    const requestedAt = new Date(
      user.passwordResetCodeExpiresAt.getTime() -
        PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000,
    );
    const cooldownEndsAt = new Date(
      requestedAt.getTime() + PASSWORD_RESET_RESEND_COOLDOWN_SECONDS * 1000,
    );
    if (cooldownEndsAt > new Date()) {
      // Still the generic response — silently skip re-sending rather than
      // exposing a distinct "please wait" response that would confirm
      // this email is registered and recently requested a reset.
      return GENERIC_RESPONSE;
    }
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(PASSWORD_RESET_OTP_TTL_MINUTES);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetCode: code, passwordResetCodeExpiresAt: expiresAt },
  });

  await sendPasswordResetOtpEmail(user.email, {
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (
    !user ||
    isOtpExpired(user.passwordResetCodeExpiresAt) ||
    user.passwordResetCode !== code.trim().toUpperCase()
  ) {
    throw INVALID_CODE_ERROR;
  }
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
    include: { twoFactorAuth: true },
  });

  await logoutAll(user.id);

  try {
    await sendPasswordChangedEmail(updated.email, {
      name: updated.name,
      action: "reset",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error(
      "[auth] Failed to send password-reset notification:",
      err.message,
    );
  }

  return sanitizeUser(updated);
}

function buildTotp(user, secret) {
  return new TOTP({
    issuer: TOTP_CONFIG.issuer,
    label: user.email,
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
  const totp = buildTotp({ email: "" }, secret);
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
  const user = await prisma.user.findUnique({ where: { id: userId } });

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
  const totp = buildTotp(user, secret);
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

async function confirmTotp({ userId, code }) {
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
  const totp = buildTotp({ email: "" }, secret);
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.twoFactorAuth.delete({ where: { userId } });

  try {
    await sendTwoFactorChangedEmail(user.email, {
      name: user.name,
      action: "disabled",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error(
      "[auth] Failed to send 2FA-disabled notification:",
      err.message,
    );
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
    include: { twoFactorAuth: true },
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

  const user = await prisma.user.findUnique({ where: { id: userId } });
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
    await sendTwoFactorChangedEmail(user.email, {
      name: user.name,
      action: "backup_codes_regenerated",
      reviewActivityUrl: `${env.appUrl}/account/activity`,
      locale,
    });
  } catch (err) {
    console.error(
      "[auth] Failed to send backup-codes-regenerated notification:",
      err.message,
    );
  }

  return { backupCodes };
}

/**
 * Creates a new account from a verified Google identity. No auto-linking —
 * if either the Google account or the email is already registered, this
 * rejects rather than silently attaching to an existing user. Email is
 * marked verified immediately (Google already proved it), so unlike
 * createAccount there's no OTP step: this logs the user straight in.
 *
 * @param {object} data
 * @param {string} data.idToken  Google ID token from the client's sign-in SDK.
 * @param {string} data.role
 * @param {string} [data.userAgent]
 * @param {string} [data.ipAddress]
 * @param {string} [data.deviceName]
 * @param {"en"|"fr"} [data.locale="en"]
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string, sessionId: string }>}
 */
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
  const existingByEmail = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });
  if (existingByEmail) {
    throw new AppError(
      "An account with this email already exists. Log in and link your Google account from settings.",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name,
      email: normalizedEmail,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      role,
      isEmailVerified: profile.emailVerified,
    },
    include: { twoFactorAuth: true },
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

/**
 * Logs in an existing user via a verified Google identity. Matched by
 * googleId only — an unlinked account with a matching email is NOT
 * treated as a match (no auto-linking), it gets a distinct error
 * pointing at the settings page instead. Same 2FA short-circuit as
 * loginWithPassword: if 2FA is enabled, this pauses and returns
 * requiresTotp rather than issuing a session.
 *
 * @param {object} data
 * @param {string} data.idToken
 * @param {string} [data.userAgent]
 * @param {string} [data.ipAddress]
 * @param {string} [data.deviceName]
 * @param {"en"|"fr"} [data.locale="en"]
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string, sessionId: string } | { requiresTotp: true, userId: string }>}
 */
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
    include: { twoFactorAuth: true },
  });

  if (!user) {
    const normalizedEmail = profile.email.trim().toLowerCase();
    const existingByEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingByEmail) {
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

// ============================================================
// Passkeys (WebAuthn)
// ============================================================

const WEBAUTHN_CHALLENGE_TTL_SECONDS = Math.floor(
  WEBAUTHN_CONFIG.timeoutMs / 1000,
);

function passkeyRegChallengeKey(userId) {
  return `webauthn:reg:${userId}`;
}

function passkeyAuthChallengeKey(email) {
  return `webauthn:auth:${email}`;
}

/**
 * Step 1 of adding a passkey to an already-logged-in account. Builds the
 * options object the client passes to @simplewebauthn/browser's
 * startRegistration(), and stashes the challenge in Redis so step 2
 * (verifyPasskeyRegistration) can confirm the response was actually
 * signed for THIS challenge, not a replayed one.
 *
 * @param {object} data
 * @param {string} data.userId
 */
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
    include: { passkeys: true },
  });
  if (!user) {
    throw new NotFoundError("Account not found.");
  }

  const options = await generateRegistrationOptions({
    rpName: WEBAUTHN_CONFIG.rpName,
    rpID: WEBAUTHN_CONFIG.rpID,
    userName: user.email,
    userID: isoUint8Array.fromUTF8String(user.id),
    userDisplayName: user.name,
    timeout: WEBAUTHN_CONFIG.timeoutMs,
    attestationType: "none",
    // Prevents registering the same authenticator twice.
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

/**
 * Step 2 — verifies the signed response against the challenge stored in
 * step 1, then persists the new credential. The public key and counter
 * are the only sensitive-ish values here, and unlike a password or TOTP
 * secret, a WebAuthn public key is safe to store as plaintext by design.
 *
 * @param {object} data
 * @param {string} data.userId
 * @param {object} data.response  The RegistrationResponseJSON from the client.
 * @param {string} [data.deviceName]  User-facing label, e.g. "MacBook Pro — Chrome".
 */
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

/**
 * Step 1 of passkey login — email-first (not usernameless/discoverable),
 * matching every other login method's shape. Scopes the ceremony to only
 * the credentials already registered to this account via allowCredentials,
 * rather than asking the authenticator "any resident credential you have."
 *
 * @param {object} data
 * @param {string} data.email
 */
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
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    include: { passkeys: true },
  });

  if (!user || user.passkeys.length === 0) {
    throw new NotFoundError("No passkeys found for this account.");
  }
  if (user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

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

/**
 * Step 2 of passkey login. The stored credential (public key + counter)
 * is looked up by the response's credential id and passed INTO
 * verifyAuthenticationResponse — the library doesn't look this up itself.
 * The library also handles the anti-clone counter check internally
 * (rejects if the response counter didn't increase, except when both the
 * stored and response counters are 0 — the common case for passkeys,
 * which often don't implement a counter at all) — this function just
 * needs to persist whatever newCounter comes back.
 *
 * Same 2FA short-circuit as every other login method.
 *
 * @param {object} data
 * @param {string} data.email
 * @param {object} data.response  The AuthenticationResponseJSON from the client.
 * @param {string} [data.userAgent]
 * @param {string} [data.ipAddress]
 * @param {string} [data.deviceName]
 * @param {"en"|"fr"} [data.locale="en"]
 */
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
    include: { user: { include: { twoFactorAuth: true } } },
  });

  if (!passkey || passkey.user.email !== normalizedEmail) {
    throw new UnauthorizedError("Passkey not recognized.");
  }
  if (passkey.user.isBlocked) {
    throw new ForbiddenError("This account has been blocked. Contact support.");
  }

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

/**
 * Lists a user's registered passkeys for a "manage your passkeys" screen.
 * Deliberately excludes credentialId and publicKey — neither is useful to
 * the client, and there's no reason to expose WebAuthn internals just
 * because they aren't strictly secret.
 *
 * @param {object} data
 * @param {string} data.userId
 */
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

/**
 * Removes a passkey — ownership is checked explicitly (the passkey's
 * userId must match the caller), not just "does this id exist," so one
 * user can't delete another's credential by guessing an id.
 *
 * @param {object} data
 * @param {string} data.userId
 * @param {string} data.passkeyId
 */
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
};
