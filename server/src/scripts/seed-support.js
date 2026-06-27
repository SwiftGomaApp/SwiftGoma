require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db.config");

const run = async () => {
  try {
    const email = "support@swiftgoma.com";
    const password = "Support@2026!";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log("⚠️  Support account already exists.");
      return;
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: "SwiftGoma Support",
        email,
        password: hashed,
        role: "SUPPORT",
        isVerified: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    console.log("✅ Support account created:");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID:       ${user.id}`);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

run();
