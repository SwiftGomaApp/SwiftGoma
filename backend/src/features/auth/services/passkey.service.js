const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { redis } = require("../../../config/redis.config");
const {
  rp_name,
  rp_id,
  origin,
  challenge_ttl,
} = require("../../../config/env.config");
const {
  sendPasskeyStatusEmail,
  sendOtpEmail,
} = require("../../../services/email.service");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const { sendOtpSms } = require("../../../services/sms.service");

const RP_NAME = rp_name || "SwiftGoma";
const RP_ID = rp_id || "localhost";
const ORIGIN = origin || "http://localhost:3000";
const CHALLENGE_TTL = parseInt(challenge_ttl || "300");

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}${"*".repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`;
};

const maskPhone = (phone) => `${phone.slice(0, 4)}****${phone.slice(-3)}`;

const extractChallenge = (clientDataJSON) => {
  const decoded = JSON.parse(
    Buffer.from(clientDataJSON, "base64url").toString("utf8"),
  );
  return decoded.challenge;
};

const getRegistrationOptions = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passkeys: { select: { credentialId: true } },
    },
  });

  if (!user) throw errors.accountNotFound();

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(user.id),
    userName: user.email || user.phone,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: user.passkeys.map((p) => ({
      id: p.credentialId,
      type: "public-key",
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  await redis.set(
    `passkey_challenge:reg:${userId}`,
    options.challenge,
    "EX",
    CHALLENGE_TTL,
  );

  return options;
};

const verifyRegistration = async ({ userId, credential, name }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) throw errors.accountNotFound();

  const challenge = await redis.get(`passkey_challenge:reg:${userId}`);
  if (!challenge) {
    throw errors.badRequest(
      "Session d'enregistrement expirée. Veuillez recommencer.",
    );
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch {
    throw errors.badRequest("Échec de la vérification de la clé d'accès.");
  }

  if (!verification.verified || !verification.registrationInfo) {
    throw errors.badRequest("Clé d'accès invalide.");
  }

  const {
    credential: cred,
    credentialDeviceType,
    credentialBackedUp,
  } = verification.registrationInfo;

  const passkeyName = name || "Clé d'accès";

  await prisma.passkey.create({
    data: {
      userId,
      name: passkeyName,
      credentialId: cred.id,
      publicKey: Buffer.from(cred.publicKey),
      counter: cred.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.response?.transports || [],
    },
  });

  await redis.del(`passkey_challenge:reg:${userId}`);

  if (user.email) {
    sendPasskeyStatusEmail({
      to: user.email,
      name: user.name,
      added: true,
      passkeyName,
    }).catch((err) =>
      console.error("📧 Passkey status email error:", err.message),
    );
  }

  return true;
};

const getAuthenticationOptions = async () => {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  await redis.set(
    `passkey_challenge:auth:${options.challenge}`,
    options.challenge,
    "EX",
    CHALLENGE_TTL,
  );

  return options;
};

const verifyAuthentication = async ({ credential }) => {
  const challenge = extractChallenge(credential.response.clientDataJSON);

  const storedChallenge = await redis.get(
    `passkey_challenge:auth:${challenge}`,
  );
  if (!storedChallenge) {
    throw errors.badRequest(
      "Session d'authentification expirée. Veuillez recommencer.",
    );
  }

  if (!credential.response.userHandle) {
    throw errors.badRequest(
      "Clé d'accès non discoverable. Veuillez vous connecter autrement.",
    );
  }

  const userId = Buffer.from(
    credential.response.userHandle,
    "base64url",
  ).toString("utf8");

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId: credential.id },
    select: {
      id: true,
      userId: true,
      publicKey: true,
      counter: true,
      transports: true,
    },
  });

  if (!passkey) throw errors.badRequest("Clé d'accès introuvable.");
  if (passkey.userId !== userId) throw errors.forbidden();

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: storedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports,
      },
    });
  } catch {
    throw errors.badRequest("Échec de la vérification de la clé d'accès.");
  }

  if (!verification.verified) {
    throw errors.badRequest("Clé d'accès invalide.");
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });

  await redis.del(`passkey_challenge:auth:${challenge}`);

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
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  return user;
};

const listPasskeys = async ({ userId }) => {
  const passkeys = await prisma.passkey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return passkeys;
};

const requestRemovePasskey = async ({ userId, passkeyId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      isDeleted: true,
      passkeys: { where: { id: passkeyId }, select: { id: true, name: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();
  if (user.passkeys.length === 0) throw errors.notFound("Passkey introuvable.");

  const sendTarget = user.email || user.phone;
  const sendType = user.email ? "email" : "phone";
  const code = await createOtp(userId, "CHANGE_EMAIL", sendTarget);

  if (sendType === "email") {
    sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "verify-email",
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

const removePasskey = async ({ userId, passkeyId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      isDeleted: true,
      passkeys: { where: { id: passkeyId }, select: { id: true } },
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();
  if (user.passkeys.length === 0) throw errors.notFound("Passkey introuvable.");

  await verifyOtp(userId, "CHANGE_EMAIL", code);

  await prisma.passkey.delete({ where: { id: passkeyId } });

  await prisma.otp.deleteMany({ where: { userId, type: "CHANGE_EMAIL" } });

  return true;
};

module.exports = {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  removePasskey,
  requestRemovePasskey,
  listPasskeys,
};
