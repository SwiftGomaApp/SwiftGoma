const readline = require("readline");
const bcrypt = require("bcryptjs");
const { getPrismaClient } = require("../src/config/prisma");

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;
const STAFF_ROLES_REQUIRING_APPROVAL = ["SUPPORT", "ACCOUNTANT"];

function guardProduction() {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = process.env.ALLOW_PROD_SEED === "true";

  if (isProd && !allowed) {
    console.error(
      "\nRefusing to run: NODE_ENV=production without ALLOW_PROD_SEED=true.\n" +
        "If you really mean to create this account in production, re-run as:\n" +
        "  ALLOW_PROD_SEED=true NODE_ENV=production npm run seed:admin\n",
    );
    process.exit(1);
  }

  if (isProd && allowed) {
    console.warn(
      "\n⚠️  Running against PRODUCTION (ALLOW_PROD_SEED=true). Proceed carefully.\n",
    );
  }
}

function ask(rl, query) {
  return new Promise((resolve) =>
    rl.question(query, (value) => resolve(value.trim())),
  );
}

function askHidden(rl, query) {
  return new Promise((resolve) => {
    rl._writeToOutput = (str) => {
      if (rl.muted) {
        rl.output.write("*".repeat(str.length));
      } else {
        rl.output.write(str);
      }
    };
    rl.muted = false;
    rl.question(query, (value) => {
      rl.muted = false;
      process.stdout.write("\n");
      resolve(value);
    });
    rl.muted = true;
  });
}

function validatePassword(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

async function promptForAccount(rl) {
  const name = await ask(rl, "Name: ");
  if (!name) throw new Error("Name is required.");

  const emailRaw = await ask(rl, "Email: ");
  const email = emailRaw.toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw new Error("Invalid email format.");

  const phoneRaw = await ask(rl, "Phone (optional, press Enter to skip): ");
  const phone = phoneRaw || null;
  if (phone && !PHONE_REGEX.test(phone)) {
    throw new Error("Invalid phone format.");
  }

  const roleChoice = await ask(
    rl,
    "Role — 1) ADMIN  2) SUPPORT  3) ACCOUNTANT: ",
  );
  const role =
    roleChoice === "1"
      ? "ADMIN"
      : roleChoice === "2"
        ? "SUPPORT"
        : roleChoice === "3"
          ? "ACCOUNTANT"
          : null;
  if (!role) throw new Error("Invalid role selection.");

  let password;
  for (;;) {
    const pw1 = await askHidden(rl, "Password: ");
    const pwError = validatePassword(pw1);
    if (pwError) {
      console.log(pwError);
      continue;
    }
    const pw2 = await askHidden(rl, "Confirm password: ");
    if (pw1 !== pw2) {
      console.log("Passwords do not match, try again.\n");
      continue;
    }
    password = pw1;
    break;
  }

  return { name, email, phone, role, password };
}

async function verifyApprovingAdmin(rl, prisma) {
  console.log(
    "\nSUPPORT and ACCOUNTANT accounts require approval from an existing ADMIN.",
  );
  const adminEmail = (await ask(rl, "Approving admin email: ")).toLowerCase();
  const adminPassword = await askHidden(rl, "Approving admin password: ");

  const adminEmailRecord = await prisma.userEmail.findUnique({
    where: { email: adminEmail },
    include: { user: true },
  });

  const admin = adminEmailRecord?.user;

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("No ADMIN account found with that email.");
  }
  if (admin.deletedAt) {
    throw new Error("That admin account is deleted.");
  }
  if (admin.isBlocked) {
    throw new Error("That admin account is blocked.");
  }
  if (!admin.password) {
    throw new Error("That admin account has no password set.");
  }

  const isValid = await bcrypt.compare(adminPassword, admin.password);
  if (!isValid) {
    throw new Error("Incorrect admin password. Approval denied.");
  }

  return admin;
}

async function main() {
  guardProduction();

  const prisma = getPrismaClient();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const { name, email, phone, role, password } = await promptForAccount(rl);

    const existing = await prisma.userEmail.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`An account with email "${email}" already exists.`);
    }

    let approvingAdmin = null;
    if (STAFF_ROLES_REQUIRING_APPROVAL.includes(role)) {
      approvingAdmin = await verifyApprovingAdmin(rl, prisma);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          phone,
          password: passwordHash,
          role,
          emails: {
            create: {
              email,
              isPrimary: true,
              isVerified: true,
            },
          },
        },
      });

      await tx.accountActionLog.create({
        data: {
          actorId: approvingAdmin ? approvingAdmin.id : null,
          actorRole: approvingAdmin ? "ADMIN" : "SYSTEM",
          targetUserId: created.id,
          targetUserEmail: email,
          action: "ADMIN_ACCOUNT_CREATED",
          reason: approvingAdmin
            ? `Approved by admin ${approvingAdmin.id}`
            : "Created via CLI seed script",
          metadata: { createdVia: "createAdminOrSupport.js", role },
        },
      });

      return created;
    });

    console.log("\n✅ Account created successfully.");
    console.log(`   Name:  ${user.name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role:  ${user.role}`);
    console.log("   (Password not shown — store it securely yourself.)\n");
  } catch (err) {
    console.error(`\n❌ ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
