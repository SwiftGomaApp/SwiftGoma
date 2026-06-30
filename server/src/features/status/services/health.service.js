const { prisma } = require("../../../config/db.config");
const { redis } = require("../../../config/redis.config");
const { verifyEmailService } = require("../../../services/email.service");
const { checkSmsHealth } = require("../../../services/sms.service");

const timed = async (fn) => {
  const start = Date.now();
  try {
    await fn();
    return {
      status: "OPERATIONAL",
      responseTimeMs: Date.now() - start,
      message: null,
    };
  } catch (err) {
    return {
      status: "MAJOR_OUTAGE",
      responseTimeMs: Date.now() - start,
      message: err.message,
    };
  }
};

const checkDatabase = () => timed(() => prisma.$queryRaw`SELECT 1`);

const checkRedis = () =>
  timed(async () => {
    const reply = await redis.ping();
    if (reply !== "PONG") throw new Error("Réponse Redis inattendue.");
  });

const checkEmail = () =>
  timed(async () => {
    const ok = await verifyEmailService();
    if (!ok) throw new Error("Connexion SMTP indisponible.");
  });

const checkSms = () =>
  timed(async () => {
    const ok = await checkSmsHealth();
    if (!ok) throw new Error("Service SMS indisponible.");
  });

module.exports = { checkDatabase, checkRedis, checkEmail, checkSms };
