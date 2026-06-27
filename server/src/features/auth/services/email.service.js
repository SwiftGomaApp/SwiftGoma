const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");
const { validateEmail } = require("../../../shared/utils/emailValidate.utils");
const { createOtp, verifyOtp } = require("../../../shared/utils/otp.utils");
const {
  sendOtpEmail,
  sendPasswordChangedEmail,
} = require("../../../services/email.service");

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  return `${local[0]}${"*".repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`;
};

// ─── Add secondary email — step 1 ────────────────────────────────────────────

const requestAddSecondaryEmail = async ({ userId, email }) => {
  const result = validateEmail(email);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      secondaryEmail: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.secondaryEmail) {
    throw errors.badRequest(
      "Vous avez déjà une adresse e-mail secondaire. Supprimez-la d'abord.",
    );
  }

  if (user.email === normalizedEmail) {
    throw errors.badRequest(
      "L'adresse e-mail secondaire doit être différente de l'adresse principale.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { secondaryEmail: normalizedEmail }],
    },
    select: { id: true },
  });

  if (conflict)
    throw errors.badRequest("Cette adresse e-mail est déjà utilisée.");

  const code = await createOtp(userId, "CHANGE_EMAIL", normalizedEmail);

  sendOtpEmail({
    to: normalizedEmail,
    name: user.name,
    code,
    context: "change-email",
  }).catch((err) => console.error("📧 Email error:", err.message));

  return { target: maskEmail(normalizedEmail) };
};

// ─── Add secondary email — step 2 ────────────────────────────────────────────

const verifyAddSecondaryEmail = async ({ userId, email, code }) => {
  const result = validateEmail(email);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      secondaryEmail: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.secondaryEmail) {
    throw errors.badRequest("Vous avez déjà une adresse e-mail secondaire.");
  }

  await verifyOtp(userId, "CHANGE_EMAIL", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      secondaryEmail: normalizedEmail,
      isSecondaryEmailVerified: true,
      secondaryEmailAddedAt: new Date(),
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "CHANGE_EMAIL" },
  });

  return true;
};

// ─── Remove secondary email ───────────────────────────────────────────────────

const removeSecondaryEmail = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      secondaryEmail: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.secondaryEmail) {
    throw errors.badRequest("Aucune adresse e-mail secondaire à supprimer.");
  }

  const sendTarget = user.email || user.phone;
  const sendType = user.email ? "email" : "phone";

  const code = await createOtp(userId, "CHANGE_EMAIL", sendTarget);

  if (sendType === "email") {
    sendOtpEmail({
      to: user.email,
      name: user.name,
      code,
      context: "change-email",
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

// ─── Verify and remove secondary email ───────────────────────────────────────

const verifyRemoveSecondaryEmail = async ({ userId, code }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      secondaryEmail: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (!user.secondaryEmail) {
    throw errors.badRequest("Aucune adresse e-mail secondaire à supprimer.");
  }

  await verifyOtp(userId, "CHANGE_EMAIL", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      secondaryEmail: null,
      isSecondaryEmailVerified: false,
      secondaryEmailAddedAt: null,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "CHANGE_EMAIL" },
  });

  return true;
};

// ─── Update primary email — step 1 ───────────────────────────────────────────

const requestUpdateEmail = async ({ userId, newEmail }) => {
  const result = validateEmail(newEmail);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      secondaryEmail: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.email === normalizedEmail) {
    throw errors.badRequest(
      "La nouvelle adresse e-mail doit être différente de l'actuelle.",
    );
  }

  if (user.secondaryEmail === normalizedEmail) {
    throw errors.badRequest(
      "Cette adresse est déjà utilisée comme e-mail secondaire.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { secondaryEmail: normalizedEmail }],
    },
    select: { id: true },
  });

  if (conflict)
    throw errors.badRequest("Cette adresse e-mail est déjà utilisée.");

  const code = await createOtp(userId, "CHANGE_EMAIL", normalizedEmail);

  sendOtpEmail({
    to: normalizedEmail,
    name: user.name,
    code,
    context: "change-email",
  }).catch((err) => console.error("📧 Email error:", err.message));

  return { target: maskEmail(normalizedEmail) };
};

// ─── Update primary email — step 2 ───────────────────────────────────────────

const verifyUpdateEmail = async ({ userId, newEmail, code }) => {
  const result = validateEmail(newEmail);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  await verifyOtp(userId, "CHANGE_EMAIL", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      isEmailVerified: true,
      googleId: null,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "CHANGE_EMAIL" },
  });

  if (user.email) {
    sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
    }).catch((err) => console.error("📧 Email error:", err.message));
  }

  return true;
};

// ─── Add primary email — step 1 (user has no email) ──────────────────────────

const requestAddPrimaryEmail = async ({ userId, email }) => {
  const result = validateEmail(email);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.email) {
    throw errors.badRequest(
      "Vous avez déjà une adresse e-mail. Utilisez la modification.",
    );
  }

  const conflict = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { secondaryEmail: normalizedEmail }],
    },
    select: { id: true },
  });

  if (conflict)
    throw errors.badRequest("Cette adresse e-mail est déjà utilisée.");

  const code = await createOtp(userId, "EMAIL_VERIFICATION", normalizedEmail);

  sendOtpEmail({
    to: normalizedEmail,
    name: user.name,
    code,
    context: "verify-email",
  }).catch((err) => console.error("📧 Email error:", err.message));

  return { target: maskEmail(normalizedEmail) };
};

// ─── Add primary email — step 2 ──────────────────────────────────────────────

const verifyAddPrimaryEmail = async ({ userId, email, code }) => {
  const result = validateEmail(email);
  if (!result.valid) throw errors.badRequest(result.message);
  const normalizedEmail = result.email;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      isDeleted: true,
    },
  });

  if (!user) throw errors.accountNotFound();
  if (!user.isActive) throw errors.forbidden();
  if (user.isDeleted) throw errors.accountDeleted();

  if (user.email) {
    throw errors.badRequest(
      "Vous avez déjà une adresse e-mail. Utilisez la modification.",
    );
  }

  await verifyOtp(userId, "EMAIL_VERIFICATION", code);

  await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      isEmailVerified: true,
    },
  });

  await prisma.otp.deleteMany({
    where: { userId, type: "EMAIL_VERIFICATION" },
  });

  return true;
};

module.exports = {
  requestAddSecondaryEmail,
  verifyAddSecondaryEmail,
  removeSecondaryEmail,
  requestUpdateEmail,
  verifyUpdateEmail,
  requestAddPrimaryEmail,
  verifyAddPrimaryEmail,
  verifyRemoveSecondaryEmail,
};
