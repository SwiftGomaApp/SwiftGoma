require("dotenv").config();
const { prisma } = require("../config/db.config");
const { seedPlans } = require("../features/seller/services/plan.service");

const run = async () => {
  try {
    console.log("🌱 Seeding seller plans...");
    await seedPlans();
    console.log("✅ Done.");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

run();
