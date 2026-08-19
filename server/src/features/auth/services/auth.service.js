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
  signMfaPendingToken,
  verifyMfaPendingToken,
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
const { claimTotpStep } = require("../utils/totpReplayGuard");
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
  safeCompareCode,
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

const SELF_ASSIGNABLE_ROLES = ["BUYER", "SELLER", "RIDER"];
const DEFAULT_SELF_REGISTRATION_ROLE = "BUYER";

function passkeyUsernamelessChallengeKey(challengeId) {
  return `webauthn:auth:usernameless:${challengeId}`;
}

function assertSelfAssignableRole(role) {
  if (role === undefined || role === null || role === "") {
    return DEFAULT_SELF_REGISTRATION_ROLE;
  }
  if (!SELF_ASSIGNABLE_ROLES.includes(role)) {
    throw new AppError(
      "Ce rôle ne peut pas être attribué via l'inscription publique.",
      422,
      "ROLE_NOT_SELF_ASSIGNABLE",
    );
  }
  return role;
}

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
    throw new ValidationError("Veuillez entrer un nom valide.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const safeRole = assertSelfAssignableRole(role);

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();

  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmail && existingEmail.isVerified) {
    throw new ConflictError("Un compte avec cet email existe déjà.");
  }

  const code = generateVerificationOtp();
  const expiresAt = getOtpExpiry(EMAIL_VERIFICATION_OTP_TTL_MINUTES);

  let user;
  if (existingEmail) {
    user = await prisma.user.update({
      where: { id: existingEmail.userId },
      data: {
        name: name.trim(),
        role: safeRole,
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
        role: safeRole,
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de vérification.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (!userEmail) {
    throw new NotFoundError("Aucun compte trouvé avec cet email.");
  }
  if (userEmail.isVerified) {
    throw new ConflictError("Cet email est déjà vérifié.");
  }
  if (isOtpExpired(userEmail.verificationCodeExpiresAt)) {
    throw new AppError(
      "Votre code de vérification a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(userEmail.verificationCode, code)) {
    throw new AppError(
      "Le code de vérification est incorrect.",
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });

  if (!userEmail) {
    throw new NotFoundError("Aucun compte trouvé avec cet email.");
  }
  if (userEmail.isVerified) {
    throw new ConflictError("Cet email est déjà vérifié.");
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const GENERIC_RESPONSE = {
    message:
      "Si un compte existe avec cet email, un code de connexion a été envoyé.",
  };

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: true },
  });

  if (!userEmail) return GENERIC_RESPONSE;
  const user = userEmail.user;
  if (user.isBlocked) return GENERIC_RESPONSE;
  if (user.deletedAt) return GENERIC_RESPONSE;
  if (!userEmail.isVerified) return GENERIC_RESPONSE;

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
        `Veuillez patienter ${secondsLeft} secondes avant de demander un nouveau code.`,
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

  return GENERIC_RESPONSE;
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
        location: await getLocationLabel(ipAddress),
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer le code de connexion.");
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
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }
  assertAccountNotDeleted(user);
  if (isOtpExpired(user.loginOtpExpiresAt)) {
    throw new AppError(
      "Votre code de connexion a expiré. Demandez-en un nouveau.",
      422,
      "OTP_EXPIRED",
    );
  }
  if (!safeCompareCode(user.loginOtp, code)) {
    throw new AppError(
      "Le code de connexion est incorrect.",
      422,
      "OTP_INVALID",
    );
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }
  if (!password || typeof password !== "string") {
    throw new ValidationError("Veuillez entrer votre mot de passe.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: { include: { emails: true, twoFactorAuth: true } } },
  });

  if (!userEmail) {
    throw new UnauthorizedError("Email ou mot de passe incorrect.");
  }
  const user = userEmail.user;
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }
  assertAccountNotDeleted(user);
  if (!userEmail.isVerified) {
    throw new AppError(
      "Veuillez vérifier votre email avant de vous connecter.",
      403,
      "EMAIL_NOT_VERIFIED",
    );
  }
  if (!user.password) {
    throw new AppError(
      "Ce compte n'a pas de mot de passe défini. Connectez-vous avec un code par email à la place.",
      409,
      "NO_PASSWORD_SET",
    );
  }

  const matches = await comparePassword(password, user.password);
  if (!matches) {
    throw new UnauthorizedError("Email ou mot de passe incorrect.");
  }

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return {
      requiresTotp: true,
      pendingToken: signMfaPendingToken({ userId: user.id }),
    };
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
    throw new UnauthorizedError("Aucun refresh token fourni.");
  }

  const claims = verifyRefreshToken(refreshToken);

  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({
    where: { id: claims.sessionId },
  });

  if (!session || session.isRevoked || session.expiresAt < new Date()) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }

  if (hashToken(refreshToken) !== session.refreshTokenHash) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { emails: true, twoFactorAuth: true },
  });
  if (!user) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
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
    include: { emails: true, twoFactorAuth: true, passkeys: true },
  });

  if (!user) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }

  return sanitizeUser(user);
}

async function logout(sessionId) {
  const prisma = getPrismaClient();
  await prisma.session.updateMany({
    where: { id: sessionId },
    data: { isRevoked: true },
  });
  return { message: "Déconnexion réussie." };
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
  return { message: "Déconnecté de tous les appareils." };
}

async function listSessions({ userId, currentSessionId }) {
  const prisma = getPrismaClient();
  const sessions = await prisma.session.findMany({
    where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
  });

  return sessions.map((session) => ({
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    deviceName: session.deviceName,
    lastUsedAt: session.lastUsedAt,
    createdAt: session.createdAt,
    isCurrent: session.id === currentSessionId,
  }));
}

async function revokeSession({ userId, sessionId }) {
  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({ where: { id: sessionId } });

  if (!session || session.userId !== userId || session.isRevoked) {
    throw new NotFoundError("Session introuvable.");
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });

  return { id: sessionId, revoked: true };
}

const PASSWORD_RESET_OTP_TTL_MINUTES = 15;
const PASSWORD_RESET_RESEND_COOLDOWN_SECONDS = 30;

async function createPassword({ userId, password, locale = "en" }) {
  if (!isValidPassword(password)) {
    throw new ValidationError(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (user.password) {
    throw new ConflictError(
      "Un mot de passe est déjà défini pour ce compte. Utilisez la mise à jour du mot de passe à la place.",
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
    throw new ValidationError(
      "Le nouveau mot de passe doit contenir au moins 8 caractères.",
    );
  }

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError("Compte introuvable.");
  }
  if (!user.password) {
    throw new ConflictError(
      "Aucun mot de passe n'est défini pour ce compte. Utilisez la création de mot de passe à la place.",
    );
  }

  const matches = await comparePassword(currentPassword || "", user.password);
  if (!matches) {
    throw new UnauthorizedError("Le mot de passe actuel est incorrect.");
  }
  if (currentPassword === newPassword) {
    throw new ValidationError(
      "Le nouveau mot de passe doit être différent du mot de passe actuel.",
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
      "Si un compte existe avec cet email, un code de réinitialisation a été envoyé.",
  };

  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
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
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }
  if (!isValidPassword(newPassword)) {
    throw new ValidationError(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
  }

  const INVALID_CODE_ERROR = new AppError(
    "Ce code de réinitialisation est invalide ou a expiré.",
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
    !safeCompareCode(userEmail.user.passwordResetCode, code)
  ) {
    throw INVALID_CODE_ERROR;
  }
  const user = userEmail.user;
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
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
  if (delta !== null) {
    const currentStep = Math.floor(Date.now() / 1000 / TOTP_CONFIG.period);
    const step = currentStep + delta;
    const isFreshUse = await claimTotpStep(twoFactorRecord.userId, step);
    if (!isFreshUse) {
      return false;
    }
    return true;
  }

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
    throw new NotFoundError("Compte introuvable.");
  }

  const existing = await prisma.twoFactorAuth.findUnique({ where: { userId } });
  if (existing && existing.isEnabled) {
    throw new ConflictError(
      "L'authentification à deux facteurs est déjà activée pour ce compte.",
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
      "Veuillez entrer le code de votre application d'authentification.",
    );
  }

  const prisma = getPrismaClient();
  const record = await prisma.twoFactorAuth.findUnique({ where: { userId } });

  if (!record) {
    throw new NotFoundError(
      "Aucune configuration à deux facteurs en cours. Commencez d'abord la configuration.",
    );
  }
  if (record.isEnabled) {
    throw new ConflictError(
      "L'authentification à deux facteurs est déjà activée.",
    );
  }

  const secret = Secret.fromBase32(decryptSecret(record.secret));
  const totp = buildTotp("", secret);
  const delta = totp.validate({
    token: code.trim(),
    window: TOTP_CONFIG.verificationWindow,
  });

  if (delta === null) {
    throw new AppError("Code de vérification invalide.", 422, "TOTP_INVALID");
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
      "L'authentification à deux facteurs n'est pas activée pour ce compte.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Code de vérification invalide.", 422, "TOTP_INVALID");
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

  return { message: "L'authentification à deux facteurs a été désactivée." };
}

async function loginWithTotp({
  pendingToken,
  code,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  if (!pendingToken) {
    throw new ValidationError(
      "Session de connexion manquante. Veuillez vous reconnecter.",
    );
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new ValidationError("Veuillez entrer votre code à deux facteurs.");
  }

  let claims;
  try {
    claims = verifyMfaPendingToken(pendingToken);
  } catch (err) {
    throw new UnauthorizedError(
      "Session de connexion expirée. Veuillez vous reconnecter.",
    );
  }
  const userId = claims.sub;

  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { emails: true, twoFactorAuth: true },
  });

  if (!user) {
    throw new UnauthorizedError(
      "Session invalide ou expirée. Veuillez vous reconnecter.",
    );
  }
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }

  assertAccountNotDeleted(user);

  const record = user.twoFactorAuth;
  if (!record || !record.isEnabled) {
    throw new ConflictError(
      "L'authentification à deux facteurs n'est pas activée pour ce compte.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Code à deux facteurs invalide.", 422, "TOTP_INVALID");
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
      "L'authentification à deux facteurs n'est pas activée pour ce compte.",
    );
  }

  const isValid = await verifyTotpOrBackupCode(prisma, record, code);
  if (!isValid) {
    throw new AppError("Code de vérification invalide.", 422, "TOTP_INVALID");
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
  const safeRole = assertSelfAssignableRole(role);
  const profile = await verifyGoogleIdToken(idToken);
  const prisma = getPrismaClient();

  const existingByGoogleId = await prisma.user.findUnique({
    where: { googleId: profile.googleId },
  });
  if (existingByGoogleId) {
    throw new ConflictError(
      "Un compte est déjà lié à ce compte Google. Veuillez vous connecter à la place.",
    );
  }

  const normalizedEmail = profile.email.trim().toLowerCase();
  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingEmail) {
    throw new AppError(
      "Un compte avec cet email existe déjà. Connectez-vous et liez votre compte Google depuis les paramètres.",
      409,
      "EMAIL_ALREADY_REGISTERED",
    );
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      role: safeRole,
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
        "Cet email est enregistré mais n'est pas encore lié à Google. Connectez-vous autrement et liez votre compte Google depuis les paramètres.",
        409,
        "GOOGLE_NOT_LINKED",
      );
    }
    throw new NotFoundError(
      "Aucun compte trouvé pour ce compte Google. Veuillez vous inscrire d'abord.",
    );
  }

  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
  }
  assertAccountNotDeleted(user);

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return {
      requiresTotp: true,
      pendingToken: signMfaPendingToken({ userId: user.id }),
    };
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
      "La configuration des passkeys est temporairement indisponible.",
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
    throw new NotFoundError("Compte introuvable.");
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
      "Le challenge d'inscription a expiré. Veuillez réessayer.",
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
      "Impossible de vérifier l'inscription du passkey.",
      422,
      "WEBAUTHN_VERIFICATION_FAILED",
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw new AppError(
      "Impossible de vérifier l'inscription du passkey.",
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
      throw new ConflictError("Ce passkey est déjà enregistré.");
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

async function generatePasskeyLoginOptions({ email } = {}) {
  if (!cache.isAvailable()) {
    throw new AppError(
      "La connexion par passkey est temporairement indisponible.",
      503,
      "WEBAUTHN_UNAVAILABLE",
    );
  }

  if (!email) {
    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_CONFIG.rpID,
      timeout: WEBAUTHN_CONFIG.timeoutMs,
      userVerification: WEBAUTHN_CONFIG.userVerification,
    });

    const challengeId = crypto.randomUUID();
    await cache.set(
      passkeyUsernamelessChallengeKey(challengeId),
      options.challenge,
      WEBAUTHN_CHALLENGE_TTL_SECONDS,
    );

    return { ...options, challengeId };
  }

  if (!isValidEmail(email)) {
    throw new ValidationError("Veuillez entrer une adresse email valide.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrismaClient();
  const userEmail = await prisma.userEmail.findUnique({
    where: { email: normalizedEmail },
    include: { user: { include: { passkeys: true } } },
  });

  if (!userEmail || userEmail.user.passkeys.length === 0) {
    throw new NotFoundError("Aucun passkey trouvé pour ce compte.");
  }
  const user = userEmail.user;
  if (user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
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
  challengeId,
  response,
  userAgent,
  ipAddress,
  deviceName,
  locale = "en",
}) {
  let expectedChallenge;
  let normalizedEmail = null;

  if (challengeId) {
    expectedChallenge = await cache.get(
      passkeyUsernamelessChallengeKey(challengeId),
    );
  } else {
    if (!isValidEmail(email)) {
      throw new ValidationError("Veuillez entrer une adresse email valide.");
    }
    normalizedEmail = email.trim().toLowerCase();
    expectedChallenge = await cache.get(
      passkeyAuthChallengeKey(normalizedEmail),
    );
  }

  if (!expectedChallenge) {
    throw new AppError(
      "Le challenge de connexion a expiré. Veuillez réessayer.",
      422,
      "WEBAUTHN_CHALLENGE_EXPIRED",
    );
  }

  const prisma = getPrismaClient();
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: response.id },
    include: { user: { include: { emails: true, twoFactorAuth: true } } },
  });

  if (!passkey) {
    throw new UnauthorizedError("Passkey non reconnu.");
  }

  if (normalizedEmail) {
    const matchesEmail = passkey.user.emails.some(
      (e) => e.email === normalizedEmail,
    );
    if (!matchesEmail) {
      throw new UnauthorizedError("Passkey non reconnu.");
    }
  }

  if (passkey.user.isBlocked) {
    throw new ForbiddenError("Ce compte a été bloqué. Contactez le support.");
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
    throw new UnauthorizedError(
      "Impossible de vérifier la connexion par passkey.",
    );
  }

  if (!verification.verified) {
    throw new UnauthorizedError(
      "Impossible de vérifier la connexion par passkey.",
    );
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  if (challengeId) {
    await cache.del(passkeyUsernamelessChallengeKey(challengeId));
  } else {
    await cache.del(passkeyAuthChallengeKey(normalizedEmail));
  }

  const user = passkey.user;

  if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
    return {
      requiresTotp: true,
      pendingToken: signMfaPendingToken({ userId: user.id }),
    };
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
    throw new NotFoundError("Passkey introuvable.");
  }

  await prisma.passkey.delete({ where: { id: passkeyId } });

  return { message: "Passkey supprimé." };
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
  listSessions,
  revokeSession,
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
