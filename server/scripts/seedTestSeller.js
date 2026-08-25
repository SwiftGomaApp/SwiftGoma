/**
 * Seeds a fully-set-up SELLER account for local testing:
 *   User (verified, password) -> SellerProfile (ACTIVE) -> SellerKyc (APPROVED)
 *   -> Shop (PUBLISHED) -> Subscription (ACTIVE, on the given plan)
 *
 * Logos/banners/documents are generated in-process (a solid-color PNG per
 * image field, a minimal real PDF per document field) and uploaded through
 * the app's own Cloudinary service, so every URL/publicId in the DB points
 * at a real, valid asset — no external hotlinks, no multer/HTTP involved.
 *
 * Usage:
 *   node scripts/seedTestSeller.js [email] [password]
 *
 * Defaults to test.seller@swiftgoma.test / Password123! if no args given.
 * Edit CONFIG below to change the shop/business details or the target plan.
 */

const zlib = require("zlib");
const bcrypt = require("bcryptjs");
const { getPrismaClient } = require("../src/config/prisma");
const {
  uploadImage,
  uploadPdf,
} = require("../src/common/services/cloudinaryUpload");
const {
  CLOUDINARY_FOLDERS,
} = require("../src/common/constants/cloudinaryFolders");
const { generateSlug } = require("../src/features/seller/utils/shop.utils");

const SALT_ROUNDS = 12;

const CONFIG = {
  email: process.argv[2] || "test.seller@swiftgoma.test",
  password: process.argv[3] || "Password123!",
  name: "Test Seller",
  phone: "+243900000001",
  businessName: "SwiftGoma Test Shop",
  businessDescription:
    "Seeded seller account for local testing — created by scripts/seedTestSeller.js.",
  whatsappNumber: "+243900000001",
  address: "12 Avenue du Lac",
  city: "Goma",
  shopName: "SwiftGoma Test Shop",
  shopDescription: "Seeded test shop for local development.",
  deliveryFee: 5,
  deliveryFeeCurrency: "USD",
  planId: "ed3c7c56-2fc3-4342-81d8-f6cc439cf881",
};

function guardProduction() {
  const isProd = process.env.NODE_ENV === "production";
  const allowed = process.env.ALLOW_PROD_SEED === "true";
  if (isProd && !allowed) {
    console.error(
      "\nRefusing to run: NODE_ENV=production without ALLOW_PROD_SEED=true.\n" +
        "This script creates fake accounts/data and should not touch production.\n",
    );
    process.exit(1);
  }
  if (isProd && allowed) {
    console.warn(
      "\n⚠️  Running against PRODUCTION (ALLOW_PROD_SEED=true). Proceed carefully.\n",
    );
  }
}

// ---------------------------------------------------------------------------
// Minimal, dependency-free PNG encoder (solid color, 8-bit truecolor RGB)
// ---------------------------------------------------------------------------

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makeSolidPng(width, height, [r, g, b]) {
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter type: none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  const signature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Minimal, dependency-free single-page PDF encoder
// ---------------------------------------------------------------------------

function makeMinimalPdf(title) {
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 150] " +
      "/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  const streamText = `BT /F1 14 Tf 20 90 Td (${title}) Tj ET`;
  objects.push(
    `5 0 obj\n<< /Length ${streamText.length} >>\nstream\n${streamText}\nendstream\nendobj\n`,
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}

// ---------------------------------------------------------------------------

async function main() {
  guardProduction();
  const prisma = getPrismaClient();

  console.log(`\nSeeding test seller: ${CONFIG.email}\n`);

  const plan = await prisma.plan.findUnique({
    where: { id: CONFIG.planId },
    include: { prices: true },
  });
  if (!plan) {
    throw new Error(
      `Plan ${CONFIG.planId} not found. Run "npm run seed:plans" first, ` +
        `or point CONFIG.planId in this script at an existing plan id.`,
    );
  }
  const planPrice =
    plan.prices.find((p) => p.billingCycle === "MONTHLY") || plan.prices[0];
  if (!planPrice) {
    throw new Error(
      `Plan "${plan.name}" (${plan.id}) has no prices configured — add one via PUT /plans/:id/prices first.`,
    );
  }

  const existingEmail = await prisma.userEmail.findUnique({
    where: { email: CONFIG.email },
  });
  if (existingEmail) {
    throw new Error(
      `An account with email "${CONFIG.email}" already exists. ` +
        `Run again with a different email: node scripts/seedTestSeller.js someone-else@swiftgoma.test`,
    );
  }

  console.log("Uploading placeholder logo/banner/document assets to Cloudinary...");
  const [
    sellerLogo,
    sellerBanner,
    shopLogo,
    shopBanner,
    selfie,
    idDocument,
    proofOfAddress,
  ] = await Promise.all([
    uploadImage(makeSolidPng(400, 200, [37, 99, 235]), CLOUDINARY_FOLDERS.SELLER_LOGOS),
    uploadImage(makeSolidPng(1200, 300, [30, 64, 175]), CLOUDINARY_FOLDERS.SELLER_BANNERS),
    uploadImage(makeSolidPng(400, 200, [16, 185, 129]), CLOUDINARY_FOLDERS.SHOP_LOGOS),
    uploadImage(makeSolidPng(1200, 300, [5, 150, 105]), CLOUDINARY_FOLDERS.SHOP_BANNERS),
    uploadImage(makeSolidPng(300, 300, [148, 163, 184]), CLOUDINARY_FOLDERS.SELLER_KYC_SELFIE),
    uploadPdf(makeMinimalPdf("SwiftGoma Test - National ID"), CLOUDINARY_FOLDERS.SELLER_KYC_ID),
    uploadPdf(makeMinimalPdf("SwiftGoma Test - Proof of Address"), CLOUDINARY_FOLDERS.SELLER_KYC_ADDRESS),
  ]);
  console.log("Assets uploaded.\n");

  const passwordHash = await bcrypt.hash(CONFIG.password, SALT_ROUNDS);
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(
    periodEnd.getDate() + (planPrice.billingCycle === "YEARLY" ? 365 : 30),
  );

  const baseSlug = generateSlug(CONFIG.shopName);
  let slug = baseSlug;
  let counter = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: CONFIG.name,
        role: "SELLER",
        password: passwordHash,
        phone: CONFIG.phone,
        isPhoneVerified: true,
        emails: {
          create: { email: CONFIG.email, isPrimary: true, isVerified: true },
        },
      },
    });

    const sellerProfile = await tx.sellerProfile.create({
      data: {
        userId: user.id,
        businessName: CONFIG.businessName,
        businessDescription: CONFIG.businessDescription,
        logoUrl: sellerLogo.url,
        logoPublicId: sellerLogo.publicId,
        bannerUrl: sellerBanner.url,
        bannerPublicId: sellerBanner.publicId,
        contactPhone: CONFIG.phone,
        contactEmail: CONFIG.email,
        whatsappNumber: CONFIG.whatsappNumber,
        address: CONFIG.address,
        city: CONFIG.city,
        status: "ACTIVE",
      },
    });

    await tx.sellerKyc.create({
      data: {
        sellerProfileId: sellerProfile.id,
        idDocumentType: "NATIONAL_ID",
        idDocumentUrl: idDocument.url,
        idDocumentPublicId: idDocument.publicId,
        selfieUrl: selfie.url,
        selfiePublicId: selfie.publicId,
        proofOfAddressUrl: proofOfAddress.url,
        proofOfAddressPublicId: proofOfAddress.publicId,
        status: "APPROVED",
        adminReviewedAt: now,
      },
    });

    const shop = await tx.shop.create({
      data: {
        sellerProfileId: sellerProfile.id,
        name: CONFIG.shopName,
        slug,
        description: CONFIG.shopDescription,
        logoUrl: shopLogo.url,
        logoPublicId: shopLogo.publicId,
        bannerUrl: shopBanner.url,
        bannerPublicId: shopBanner.publicId,
        deliveryFee: CONFIG.deliveryFee,
        deliveryFeeCurrency: CONFIG.deliveryFeeCurrency,
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        sellerProfileId: sellerProfile.id,
        planId: plan.id,
        billingCycle: planPrice.billingCycle,
        currency: planPrice.currency,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenew: true,
      },
    });

    return { user, sellerProfile, shop, subscription };
  });

  console.log("✅ Test seller created:\n");
  console.log(`   Email:         ${CONFIG.email}`);
  console.log(`   Password:      ${CONFIG.password}`);
  console.log(`   User ID:       ${result.user.id}`);
  console.log(`   SellerProfile: ${result.sellerProfile.id} (ACTIVE, KYC APPROVED)`);
  console.log(`   Shop:          ${result.shop.name} — /${result.shop.slug} (PUBLISHED)`);
  console.log(
    `   Subscription:  ${plan.name} — ${planPrice.billingCycle}/${planPrice.currency}, ` +
      `ACTIVE until ${periodEnd.toISOString().slice(0, 10)}`,
  );
  console.log(
    `\nLog in with POST {{baseUrl}}{{apiVersion}}/auth/login/password using the email/password above.\n`,
  );
}

main()
  .catch((err) => {
    console.error(`\n❌ ${err.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const prisma = getPrismaClient();
    await prisma.$disconnect();
  });
