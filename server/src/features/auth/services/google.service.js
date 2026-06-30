const { OAuth2Client } = require("google-auth-library");
const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { google_web_client_id } = require("../../../config/env.config");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const {
  sendOtpEmail,
  sendGoogleLinkStatusEmail,
} = require("../../../services/email.service");
const { sendOtpSms } = require("../../../services/sms.service");

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}${"*".repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`;
};

const maskPhone = (phone) => {
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
};

const client = new OAuth2Client(google_web_client_id);

const verifyGoogleToken = async (token) => {
  let payload;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: google_web_client_id,
    });
    payload = ticket.getPayload();
  } catch {
    try {
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error("userinfo failed");
      payload = await response.json();
    } catch {
      throw errors.badRequest("Token Google invalide ou expiré.");
    }
  }

  if (!payload?.email_verified) {
    throw errors.badRequest(
      "Votre adresse Google n'est pas vérifiée. Veuillez utiliser un autre compte.",
    );
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatar: payload.picture,
  };
};

const registerWithGoogle = async ({ idToken, role }) => {
  const allowedRoles = ["BUYER", "SELLER"];
  if (!role || !allowedRoles.includes(role)) {
    throw errors.badRequest("Le rôle doit être BUYER ou SELLER.");
  }

  const { googleId, email, name, avatar } = await verifyGoogleToken(idToken);

  const existing = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
      isDeleted: true,
      googleId: true,
    },
  });

  if (existing?.googleId) {
    throw errors.badRequest(
      "Un compte Google existe déjà avec cette adresse. Veuillez vous connecter.",
    );
  }

  if (existing) {
    if (!existing.isActive) throw errors.forbidden();
    if (existing.isDeleted) throw errors.accountDeleted();

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId,
        avatar,
        isVerified: true,
        isEmailVerified: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return { user: updated, isNew: false };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      googleId,
      avatar,
      role,
      isVerified: true,
      isEmailVerified: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  return { user, isNew: true };
};

const loginWithGoogle = async ({ idToken }) => {
  const { googleId, email, avatar } = await verifyGoogleToken(idToken);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      googleId: true,
      isVerified: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) {
    throw errors.badRequest(
      "Aucun compte associé à ce compte Google. Veuillez vous inscrire.",
    );
  }

  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.googleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { googleId, avatar, isEmailVerified: true },
    });
  }

  return user;
};

const requestUnlinkGoogle = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      googleId: true,
      password: true,
      isActive: true,
      isDeleted: true,
      passkeys: { select: { id: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.googleId) {
    throw errors.badRequest("Aucun compte Google lié à votre compte.");
  }

  if (!user.password && user.passkeys.length === 0) {
    throw errors.badRequest(
      "Impossible de délier Google : définissez d'abord un mot de passe ou ajoutez une clé d'accès.",
    );
  }

  const sendTarget = user.email || user.phone;
  const sendType = user.email ? "email" : "phone";

  const code = await createOtp(userId, "DISCONNECT_GOOGLE", sendTarget);

  if (sendType === "email") {
    sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "unlink-google",
    }).catch((err) => console.error("📧 Email error:", err.message));
  } else {
    sendOtpSms({ to: user.phone, code }).catch((err) =>
      console.error("SMS error:", err.message),
    );
  }

  return {
    target:
      sendType === "email" ? maskEmail(sendTarget) : maskPhone(sendTarget),
    type: sendType,
  };
};

const verifyUnlinkGoogle = async ({ userId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      googleId: true,
      password: true,
      isActive: true,
      isDeleted: true,
      passkeys: { select: { id: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.googleId) {
    throw errors.badRequest("Aucun compte Google lié à votre compte.");
  }

  if (!user.password && user.passkeys.length === 0) {
    throw errors.badRequest(
      "Impossible de délier Google : définissez d'abord un mot de passe ou ajoutez une clé d'accès.",
    );
  }

  await verifyOtp(userId, "DISCONNECT_GOOGLE", code);

  await prisma.user.update({
    where: { id: userId },
    data: { googleId: null },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "DISCONNECT_GOOGLE" },
  });

  if (user.email) {
    sendGoogleLinkStatusEmail({
      to: user.email,
      name: user.name,
      linked: false,
    }).catch((err) =>
      console.error("📧 Google unlink email error:", err.message),
    );
  }

  return true;
};

const linkGoogle = async ({ userId, idToken }) => {
  const { googleId, email, avatar } = await verifyGoogleToken(idToken);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      googleId: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.googleId) {
    throw errors.badRequest("Un compte Google est déjà lié à votre compte.");
  }

  const conflict = await prisma.user.findFirst({
    where: { googleId },
    select: { id: true },
  });

  if (conflict && conflict.id !== userId) {
    throw errors.badRequest(
      "Ce compte Google est déjà associé à un autre compte SwiftGoma.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleId,
      avatar,
      isEmailVerified: user.email === email ? true : undefined,
    },
  });

  if (user.email) {
    sendGoogleLinkStatusEmail({
      to: user.email,
      name: user.name,
      linked: true,
    }).catch((err) =>
      console.error("📧 Google link email error:", err.message),
    );
  }

  return true;
};

const unlinkGoogle = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      googleId: true,
      password: true,
      passkeys: { select: { id: true } },
    },
  });

  if (!user) throw errors.accountNotFound();

  if (!user.googleId) {
    throw errors.badRequest("Aucun compte Google lié à votre compte.");
  }

  if (!user.password && user.passkeys.length === 0) {
    throw errors.badRequest(
      "Impossible de délier Google : définissez d'abord un mot de passe ou ajoutez une clé d'accès.",
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { googleId: null },
  });

  return true;
};

module.exports = {
  registerWithGoogle,
  loginWithGoogle,
  requestUnlinkGoogle,
  verifyUnlinkGoogle,
  linkGoogle,
  unlinkGoogle,
};
