const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const VALID_LANGUAGES = ["FR", "SW"];

const getPreferences = async ({ userId }) => {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });

  if (!prefs) {
    return { language: "FR", notifyEmail: true, notifySms: true };
  }

  return prefs;
};

const updatePreferences = async ({
  userId,
  language,
  notifyEmail,
  notifySms,
}) => {
  if (language && !VALID_LANGUAGES.includes(language)) {
    throw errors.badRequest(
      `Langue invalide. Valeurs acceptées : ${VALID_LANGUAGES.join(", ")}.`,
    );
  }

  const data = {};
  if (language !== undefined) data.language = language;
  if (notifyEmail !== undefined) data.notifyEmail = Boolean(notifyEmail);
  if (notifySms !== undefined) data.notifySms = Boolean(notifySms);

  return prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
};

module.exports = { getPreferences, updatePreferences };
