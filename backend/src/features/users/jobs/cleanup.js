const cron = require("node-cron");
const { prisma } = require("../../../config/db.config");
const { cloudinary } = require("../../../config/coudinary.config");

const cleanupDeletedAccounts = async () => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const accounts = await prisma.user.findMany({
    where: { isDeleted: true, deletedAt: { lt: cutoff } },
    select: {
      id: true,
    },
  });

  if (accounts.length === 0) return;

  console.log(`Permanently deleting ${accounts.length} expired account(s)...`);

  for (const account of accounts) {
    try {
      // NOTE: before deleting, check wallet balance:
      // if (account.wallet?.balance > 0) {
      //   log or flag for manual review — never silently destroy money
      // }

      // Hard delete — Prisma cascades handle related rows
      await prisma.user.delete({ where: { id: account.id } });

      console.log(`Deleted account ${account.id}`);
    } catch (err) {
      console.error(`Failed to delete account ${account.id}:`, err.message);
    }
  }
};

const startAccountCleanupCron = () => {
  cron.schedule("0 4 * * *", async () => {
    try {
      await cleanupDeletedAccounts();
    } catch (err) {
      console.error("Account cleanup cron error:", err.message);
    }
  });

  console.log("Account cleanup cron started");
};

module.exports = { startAccountCleanupCron };
