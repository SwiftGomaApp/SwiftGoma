const crypto = require("crypto");
const { prisma } = require("../../config/db.config");
const {
  redis,
  keys,
  setEx,
  get,
  del,
  incr,
} = require("../../config/redis.config");
const { otp_expres_in } = require("../../config/env.config");
const { AppError } = require("../errors/app.error");

const OTP_EXPIRES_IN_MINUTES = parseInt(otp_expres_in || "10");
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const generateOtpCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const createOtp = async (userId, type, target) => {
  const cooldownKey = `otp_cooldown:${userId}:${type}`;
  const onCooldown = await get(cooldownKey);

  if (onCooldown) {
    const ttl = await redis.ttl(cooldownKey);
    throw new AppError(
      `Veuillez patienter ${ttl} secondes avant de demander un nouveau code.`,
      429,
      "OTP_COOLDOWN",
    );
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_IN_MINUTES * 60 * 1000);

  await prisma.otp.updateMany({
    where: {
      userId,
      type,
      usedAt: { equals: null },
    },
    data: { usedAt: new Date() },
  });

  const otp = await prisma.otp.create({
    data: { userId, code, type, target, expiresAt },
  });

  await setEx(
    keys.otp(userId, type),
    { otpId: otp.id, code, expiresAt },
    OTP_EXPIRES_IN_MINUTES * 60,
  );

  await redis.set(cooldownKey, "1", "EX", OTP_RESEND_COOLDOWN_SECONDS);

  return code;
};

const verifyOtp = async (userId, type, code) => {
  const attemptsKey = `otp_attempts:${userId}:${type}`;
  const attempts = await get(attemptsKey);

  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError(
      "Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
      429,
      "OTP_MAX_ATTEMPTS",
    );
  }

  const cached = await get(keys.otp(userId, type));

  if (cached) {
    if (new Date(cached.expiresAt) < new Date()) {
      await del(keys.otp(userId, type));
      throw new AppError(
        "Ce code OTP a expiré. Veuillez en demander un nouveau.",
        401,
        "OTP_EXPIRED",
      );
    }

    if (cached.code !== code) {
      await incr(attemptsKey, OTP_EXPIRES_IN_MINUTES * 60);
      throw new AppError("Code OTP invalide.", 401, "INVALID_OTP");
    }

    await prisma.otp.update({
      where: { id: cached.otpId },
      data: { usedAt: new Date() },
    });

    await del(keys.otp(userId, type));
    await del(attemptsKey);

    return true;
  }

  // Fallback to DB
  const otp = await prisma.otp.findFirst({
    where: {
      userId,
      type,
      usedAt: { equals: null },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new AppError("Code OTP invalide ou expiré.", 401, "INVALID_OTP");
  }

  if (otp.code !== code) {
    await incr(attemptsKey, OTP_EXPIRES_IN_MINUTES * 60);
    throw new AppError("Code OTP invalide.", 401, "INVALID_OTP");
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  await del(attemptsKey);

  return true;
};

const invalidateOtp = async (userId, type) => {
  await prisma.otp.updateMany({
    where: {
      userId,
      type,
      usedAt: { equals: null },
    },
    data: { usedAt: new Date() },
  });

  await del(keys.otp(userId, type));
};

module.exports = { createOtp, verifyOtp, invalidateOtp, generateOtpCode };
