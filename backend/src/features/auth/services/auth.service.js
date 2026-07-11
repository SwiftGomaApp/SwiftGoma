const bcrypt = require("bcryptjs");
const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { validateEmail } = require("../../../shared/utils/emailValidate.utils");
const {
  validatePhone,
  detectIdentifierType,
} = require("../../../shared/utils/validatePhone.utils");
const { validateName } = require("../../../shared/utils/validateName.utils");
const {
  validatePassword,
} = require("../../../shared/utils/validatePassword.utils");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const { createSession } = require("../../../shared/utils/session.utils");
const { detectDevice } = require("../../../shared/utils/device.utils");
const {
  setAuthCookies,
  setRefreshCookie,
  signAccessToken,
} = require("../../../shared/utils/cookie.utils");
const {
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} = require("../../../services/email.service");
const { sendOtpSms } = require("../../../services/sms.service");
const { getDeviceId, getPlatform } = require("../../../shared/utils/platform.utils");

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}${"*".repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`;
};

const maskPhone = (phone) => {
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const resolveIdentifier = (identifier) => {
  const type = detectIdentifierType(identifier);
  if (!type)
    throw errors.badRequest(
      "Veuillez entrer une adresse email ou un numéro de téléphone valide.",
    );

  if (type === "email") {
    const result = validateEmail(identifier);
    if (!result.valid) throw errors.badRequest(result.message);
    return { type, value: result.email };
  } else {
    const result = validatePhone(identifier);
    if (!result.valid) throw errors.badRequest(result.message);
    return { type, value: result.phone };
  }
};

const createLoginSession = async (user, req, res) => {
  const deviceInfo = detectDevice(req);
  const platform = getPlatform(req);
  const deviceId = getDeviceId(req);

  const { session, refreshToken } = await createSession({
    userId: user.id,
    role: user.role,
    deviceInfo,
    platform,
    deviceId,
  });

  const userPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  if (platform === "MOBILE") {
    // Mobile: no cookies. Tokens go in the response body — the client stores
    // them in flutter_secure_storage (Keychain/Keystore), not in-memory JS.
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      sessionId: session.id,
    });

    return { user: userPayload, accessToken, refreshToken };
  }

  // Web (admin): HttpOnly cookies only, no tokens in the response body.
  setAuthCookies(res, {
    userId: user.id,
    role: user.role,
    sessionId: session.id,
  });
  setRefreshCookie(res, refreshToken);

  return { user: userPayload };
};

const register = async ({ name, email, phone, role }) => {
  const nameResult = validateName(name);
  if (!nameResult.valid) throw errors.badRequest(nameResult.message);

  const allowedRoles = ["BUYER", "SELLER"];
  if (!role || !allowedRoles.includes(role)) {
    throw errors.badRequest("Le rôle doit être BUYER ou SELLER.");
  }

  if (!email && !phone) {
    throw errors.badRequest(
      "Une adresse email ou un numéro de téléphone est requis.",
    );
  }

  let normalizedEmail = null;
  let normalizedPhone = null;
  let identifierType = null;

  if (email) {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) throw errors.badRequest(emailResult.message);
    normalizedEmail = emailResult.email;
    identifierType = "email";
  } else {
    const phoneResult = validatePhone(phone);
    if (!phoneResult.valid) throw errors.badRequest(phoneResult.message);
    normalizedPhone = phoneResult.phone;
    identifierType = "phone";
  }

  const existing = await prisma.user.findFirst({
    where: normalizedEmail
      ? { email: normalizedEmail }
      : { phone: normalizedPhone },
  });

  if (existing) {
    if (existing.isVerified) {
      throw normalizedEmail
        ? errors.emailAlreadyExists()
        : errors.phoneAlreadyExists();
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { name: nameResult.name, role },
    });

    const target = normalizedEmail || normalizedPhone;
    const code = await createOtp(existing.id, "ACCOUNT_VERIFICATION", target);

    if (identifierType === "email") {
      sendOtpEmail({
        to: normalizedEmail,
        name: nameResult.name,
        code,
        context: "verify-email",
      }).catch((err) => console.error("📧 Email error:", err.message));
    } else {
      sendOtpSms({ to: normalizedPhone, code }).catch((err) =>
        console.error("SMS error:", err.message),
      );
    }

    return {
      userId: existing.id,
      type: identifierType,
      target:
        identifierType === "email"
          ? maskEmail(normalizedEmail)
          : maskPhone(normalizedPhone),
    };
  }

  const user = await prisma.user.create({
    data: {
      name: nameResult.name,
      email: normalizedEmail,
      phone: normalizedPhone,
      role,
      isVerified: false,
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  const target = normalizedEmail || normalizedPhone;
  const code = await createOtp(user.id, "ACCOUNT_VERIFICATION", target);

  if (identifierType === "email") {
    sendOtpEmail({
      to: normalizedEmail,
      name: user.name,
      code,
      context: "verify-email",
    }).catch((err) => console.error("📧 Email error:", err.message));
  } else {
    sendOtpSms({ to: normalizedPhone, code }).catch((err) =>
      console.error("SMS error:", err.message),
    );
  }

  return {
    userId: user.id,
    type: identifierType,
    target:
      identifierType === "email"
        ? maskEmail(normalizedEmail)
        : maskPhone(normalizedPhone),
  };
};

const verifyAccount = async ({ userId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isVerified) throw errors.badRequest("Ce compte est déjà vérifié.");

  await verifyOtp(userId, "ACCOUNT_VERIFICATION", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      isEmailVerified: user.email ? true : undefined,
      isPhoneVerified: user.phone ? true : undefined,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "ACCOUNT_VERIFICATION" },
  });

  if (user.email) {
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    }).catch((err) => console.error("📧 Welcome email error:", err.message));
  }

  return { userId: user.id, name: user.name };
};

const resendOtp = async ({ userId, type }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isVerified && type === "ACCOUNT_VERIFICATION") {
    throw errors.badRequest("Ce compte est déjà vérifié.");
  }

  const otpContextMap = {
    ACCOUNT_VERIFICATION: "verify-email",
    SIGNIN: "signin",
    RESET_PASSWORD: "reset-password",
  };

  const target = user.email || user.phone;
  const code = await createOtp(user.id, type, target);

  if (user.email) {
    sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: otpContextMap[type] || "verify-email",
    }).catch((err) => console.error("📧 Email error:", err.message));
  } else {
    sendOtpSms({ to: user.phone, code }).catch((err) =>
      console.error("SMS error:", err.message),
    );
  }

  return {
    target: user.email ? maskEmail(user.email) : maskPhone(user.phone),
    type: user.email ? "email" : "phone",
  };
};

const loginWithOtp = async ({ identifier }) => {
  const { type, value } = resolveIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where:
      type === "email"
        ? { OR: [{ email: value }, { secondaryEmail: value }] }
        : { phone: value },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      secondaryEmail: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (!user.isVerified)
    throw errors.badRequest("Votre compte n'est pas encore vérifié.");

  const sendTarget = user.email || user.phone;
  const sendType = user.email ? "email" : "phone";
  const code = await createOtp(user.id, "SIGNIN", sendTarget);

  if (sendType === "email") {
    sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "signin",
    }).catch((err) => console.error("📧 Email error:", err.message));
  } else {
    sendOtpSms({ to: user.phone, code }).catch((err) =>
      console.error("SMS error:", err.message),
    );
  }

  return {
    userId: user.id,
    type: sendType,
    target:
      sendType === "email" ? maskEmail(user.email) : maskPhone(user.phone),
  };
};

const verifyLoginOtp = async ({ userId, code }, req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (!user.isVerified) throw errors.badRequest("Compte non vérifié.");

  await verifyOtp(userId, "SIGNIN", code);
  await prisma.otp.deleteMany({ where: { userId, type: "SIGNIN" } });

  return createLoginSession(user, req, res);
};

const createPassword = async ({ userId, password }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true, isVerified: true, isActive: true },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (!user.isVerified) throw errors.badRequest("Compte non vérifié.");
  if (user.password)
    throw errors.badRequest(
      "Un mot de passe existe déjà. Utilisez la modification.",
    );

  const result = validatePassword(password);
  if (!result.valid) throw errors.badRequest(result.message);

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, passwordChangedAt: new Date() },
  });

  return true;
};

const loginWithPassword = async ({ identifier, password }, req, res) => {
  const { type, value } = resolveIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where:
      type === "email"
        ? { OR: [{ email: value }, { secondaryEmail: value }] }
        : { phone: value },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      password: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user) throw errors.invalidCredentials();
  if (!user.isActive) throw errors.forbidden();
  if (!user.isVerified)
    throw errors.badRequest("Votre compte n'est pas encore vérifié.");
  if (!user.password)
    throw errors.badRequest(
      "Aucun mot de passe défini. Connectez-vous avec un code OTP.",
    );

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw errors.invalidCredentials();

  return createLoginSession(user, req, res);
};

const forgotPassword = async ({ identifier }) => {
  const { type, value } = resolveIdentifier(identifier);

  const user = await prisma.user.findFirst({
    where:
      type === "email"
        ? { OR: [{ email: value }, { secondaryEmail: value }] }
        : { phone: value },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      secondaryEmail: true,
      isSecondaryEmailVerified: true,
      isVerified: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || !user.isVerified) {
    return {
      userId: null,
      target: type === "email" ? maskEmail(value) : maskPhone(value),
      type,
    };
  }

  let sendTarget;
  let sendType;

  if (
    type === "email" &&
    user.secondaryEmail === value &&
    user.isSecondaryEmailVerified
  ) {
    sendTarget = user.secondaryEmail;
    sendType = "email";
  } else {
    sendTarget = user.email || user.phone;
    sendType = user.email ? "email" : "phone";
  }

  const code = await createOtp(user.id, "RESET_PASSWORD", sendTarget);

  if (sendType === "email") {
    sendOtpEmail({
      to: sendTarget,
      name: user.name,
      code,
      context: "reset-password",
    }).catch((err) => console.error("📧 Email error:", err.message));
  } else {
    sendOtpSms({ to: sendTarget, code }).catch((err) =>
      console.error("SMS error:", err.message),
    );
  }

  return {
    userId: user.id,
    target:
      sendType === "email" ? maskEmail(sendTarget) : maskPhone(sendTarget),
    type: sendType,
  };
};

const resetPassword = async ({ userId, code, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isVerified: true, isActive: true },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();

  const passwordResult = validatePassword(newPassword);
  if (!passwordResult.valid) throw errors.badRequest(passwordResult.message);

  await verifyOtp(userId, "RESET_PASSWORD", code);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, passwordChangedAt: new Date() },
  });
  await prisma.otp.deleteMany({ where: { userId, type: "RESET_PASSWORD" } });

  return true;
};

const updatePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.password) {
    throw errors.badRequest(
      "Aucun mot de passe défini. Utilisez la création de mot de passe.",
    );
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw errors.badRequest("Mot de passe actuel incorrect.");
  }

  if (currentPassword === newPassword) {
    throw errors.badRequest(
      "Le nouveau mot de passe doit être différent de l'ancien.",
    );
  }

  const result = validatePassword(newPassword);
  if (!result.valid) throw errors.badRequest(result.message);

  const hashed = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed, passwordChangedAt: new Date() },
  });

  if (user.email) {
    sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
    }).catch((err) =>
      console.error("📧 Password changed email error:", err.message),
    );
  }

  return true;
};

module.exports = {
  register,
  verifyAccount,
  resendOtp,
  loginWithOtp,
  verifyLoginOtp,
  createPassword,
  loginWithPassword,
  forgotPassword,
  resetPassword,
  updatePassword,
  createLoginSession,
};
