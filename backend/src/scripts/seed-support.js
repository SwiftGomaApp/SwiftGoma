"use strict";

const readline = require("readline");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    let input = "";

    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const onData = (char) => {
      char = char.toString();

      switch (char) {
        case "\n":
        case "\r":
        case "\u0004": // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(input.trim());
          break;
        case "\u0003": // Ctrl+C
          process.stdout.write("\n");
          process.exit(1);
          break;
        case "\u007f": // Backspace
        case "\b":
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
          break;
        default:
          input += char;
          process.stdout.write("*");
          break;
      }
    };

    stdin.on("data", onData);
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

async function askName() {
  while (true) {
    const name = await ask("Full name: ");
    if (name.length >= 2) return name;
    console.log("  → Name must be at least 2 characters.");
  }
}

async function askEmail() {
  while (true) {
    const email = await ask("Email: ");
    if (EMAIL_REGEX.test(email)) return email.toLowerCase();
    console.log("  → Please enter a valid email address.");
  }
}

async function askPhone() {
  while (true) {
    const phone = await ask("Phone (optional, press Enter to skip): ");
    if (!phone) return null;
    if (PHONE_REGEX.test(phone)) return phone;
    console.log(
      "  → Please enter digits only (7-15 digits, optional leading +).",
    );
  }
}

async function askPassword() {
  while (true) {
    const password = await askHidden("Password (min 8 characters): ");
    if (password.length < 8) {
      console.log("  → Password must be at least 8 characters.");
      continue;
    }
    const confirm = await askHidden("Confirm password: ");
    if (password !== confirm) {
      console.log("  → Passwords do not match. Let's try again.\n");
      continue;
    }
    return password;
  }
}

async function seedSupport() {
  console.log("── Create support user ─────────────────────────\n");

  const name = await askName();
  const email = await askEmail();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const overwrite = await ask(
      `A user with "${email}" already exists (role: ${existing.role}). Overwrite and promote to SUPPORT? (y/N): `,
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("Aborted. No changes made.");
      return;
    }
  }

  const phone = await askPhone();
  const password = await askPassword();

  const hashedPassword = await bcrypt.hash(password, 12);

  const support = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      phone,
      password: hashedPassword,
      role: "SUPPORT",
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: !!phone,
      isActive: true,
      isBlocked: false,
      isDeleted: false,
    },
    create: {
      name,
      email,
      phone,
      password: hashedPassword,
      role: "SUPPORT",
      isVerified: true,
      isEmailVerified: true,
      isPhoneVerified: !!phone,
    },
  });

  console.log("\nSupport user ready:");
  console.log(`   id:    ${support.id}`);
  console.log(`   name:  ${support.name}`);
  console.log(`   email: ${support.email}`);
  console.log(`   phone: ${support.phone || "—"}`);
  console.log(`   role:  ${support.role}`);
}

seedSupport()
  .catch((err) => {
    console.error("❌ Failed to seed support user:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
