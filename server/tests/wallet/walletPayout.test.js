process.env.NODE_ENV = "test";

jest.mock("../../src/config/sms", () => ({
  sendSms: jest.fn().mockResolvedValue({}),
  checkSmsConnection: jest.fn(),
}));

jest.mock("../../src/features/payments/services/mbioyopay.service", () => ({
  initiatePayin: jest.fn(),
  initiatePayout: jest.fn(),
}));

const { getPrismaClient } = require("../../src/config/prisma");
const cache = require("../../src/common/services/cache");
const { sendSms } = require("../../src/config/sms");
const {
  initiatePayout,
} = require("../../src/features/payments/services/mbioyopay.service");
const {
  requestPayoutOtp,
  initiateSellerPayout,
} = require("../../src/features/wallet/services/wallet.service");

const prisma = getPrismaClient();

const RUN_ID = `wallet-payout-${Date.now()}`;

const createdUserIds = [];
const createdSellerProfileIds = [];

async function createApprovedSeller(suffix, { startingBalance = 100 } = {}) {
  const user = await prisma.user.create({
    data: {
      name: `Test Seller ${suffix}`,
      role: "SELLER",
      emails: {
        create: {
          email: `${RUN_ID}-${suffix}@example.com`,
          isPrimary: true,
          isVerified: true,
        },
      },
    },
  });
  createdUserIds.push(user.id);

  const profile = await prisma.sellerProfile.create({
    data: {
      userId: user.id,
      businessName: `Test Business ${suffix}`,
      businessDescription: "Test",
      logoUrl: "https://example.com/logo.png",
      logoPublicId: "logo-public-id",
      bannerUrl: "https://example.com/banner.png",
      bannerPublicId: "banner-public-id",
      contactPhone: "+243900000000",
      contactEmail: `${RUN_ID}-${suffix}@example.com`,
      whatsappNumber: "+243900000000",
      address: "123 Test Street",
      status: "ACTIVE",
      kyc: {
        create: {
          idDocumentType: "NATIONAL_ID",
          idDocumentUrl: "https://example.com/id.jpg",
          idDocumentPublicId: "id-doc",
          selfieUrl: "https://example.com/selfie.jpg",
          selfiePublicId: "selfie",
          proofOfAddressUrl: "https://example.com/proof.jpg",
          proofOfAddressPublicId: "proof",
          status: "APPROVED",
        },
      },
      walletSettings: {
        create: {
          payoutPhoneNumber: "+243900000000",
          payoutProvider: "MBIYOPAY",
          payoutCountry: "CD",
        },
      },
    },
    include: { walletSettings: true },
  });
  createdSellerProfileIds.push(profile.id);

  const wallet = await prisma.wallet.create({
    data: { sellerProfileId: profile.id },
  });
  await prisma.walletBalance.create({
    data: { walletId: wallet.id, currency: "USD", balance: startingBalance },
  });

  return { user, profile, wallet };
}

async function requestAndReadOtp(sellerProfileId) {
  await requestPayoutOtp(sellerProfileId);
  const smsCall = sendSms.mock.calls.at(-1)[0];
  const code = smsCall.message.match(/^(\d+)/)[1];
  return code;
}

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  try {
    for (const sellerProfileId of createdSellerProfileIds) {
      const wallet = await prisma.wallet.findUnique({
        where: { sellerProfileId },
      });
      if (wallet) {
        await prisma.walletTransaction.deleteMany({
          where: { walletId: wallet.id },
        });
        await prisma.walletBalance.deleteMany({
          where: { walletId: wallet.id },
        });
        await prisma.wallet.delete({ where: { id: wallet.id } });
      }
      await prisma.minimumPayoutAmount.deleteMany({
        where: { walletSettings: { sellerProfileId } },
      });
      await prisma.walletSettings
        .delete({ where: { sellerProfileId } })
        .catch(() => {});
      await prisma.sellerKyc
        .delete({ where: { sellerProfileId } })
        .catch(() => {});
      await prisma.sellerProfile
        .delete({ where: { id: sellerProfileId } })
        .catch(() => {});
    }
    for (const userId of createdUserIds) {
      await prisma.userEmail.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
  } catch (err) {
    console.error("Cleanup error (non-fatal):", err.message);
  }
  await prisma.$disconnect();
}, 60000);

describe("wallet payout: OTP single-use", () => {
  test("the same OTP cannot be consumed twice", async () => {
    const { profile } = await createApprovedSeller("otp-reuse");
    const code = await requestAndReadOtp(profile.id);

    initiatePayout.mockResolvedValue({
      orderId: "SWG-PAYOUT-1",
      transaction_id: "MOCK-TXN-1",
    });

    const first = await initiateSellerPayout({
      sellerProfileId: profile.id,
      currency: "USD",
      amount: 10,
      otpCode: code,
    });
    expect(first.balance.balance).toBe(90);

    await expect(
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 10,
        otpCode: code,
      }),
    ).rejects.toThrow(/expiré/);

    expect(initiatePayout).toHaveBeenCalledTimes(1);
  }, 30000);
});

describe("wallet payout: concurrent double-submit", () => {
  test("two concurrent requests with the same OTP only debit the wallet once", async () => {
    const { profile } = await createApprovedSeller("double-submit");
    const code = await requestAndReadOtp(profile.id);

    initiatePayout.mockResolvedValue({
      orderId: "SWG-PAYOUT-2",
      transaction_id: "MOCK-TXN-2",
    });

    const results = await Promise.allSettled([
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 15,
        otpCode: code,
      }),
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 15,
        otpCode: code,
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toMatch(/déjà en cours/);
    expect(initiatePayout).toHaveBeenCalledTimes(1);

    const wallet = await prisma.wallet.findUnique({
      where: { sellerProfileId: profile.id },
    });
    const balance = await prisma.walletBalance.findUnique({
      where: { walletId_currency: { walletId: wallet.id, currency: "USD" } },
    });
    expect(Number(balance.balance)).toBe(85);
  }, 30000);
});

describe("wallet payout: insufficient balance", () => {
  test("rejects a payout larger than the available balance and does not call the provider", async () => {
    const { profile } = await createApprovedSeller("insufficient", {
      startingBalance: 5,
    });
    const code = await requestAndReadOtp(profile.id);

    await expect(
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 50,
        otpCode: code,
      }),
    ).rejects.toThrow(/[Ss]olde insuffisant/);

    expect(initiatePayout).not.toHaveBeenCalled();

    const wallet = await prisma.wallet.findUnique({
      where: { sellerProfileId: profile.id },
    });
    const balance = await prisma.walletBalance.findUnique({
      where: { walletId_currency: { walletId: wallet.id, currency: "USD" } },
    });
    expect(Number(balance.balance)).toBe(5);
  }, 30000);
});

describe("wallet payout: minimum payout amount", () => {
  test("rejects a payout below the configured minimum for that currency", async () => {
    const { profile } = await createApprovedSeller("min-amount");
    await prisma.minimumPayoutAmount.create({
      data: {
        walletSettingsId: (
          await prisma.walletSettings.findUnique({
            where: { sellerProfileId: profile.id },
          })
        ).id,
        currency: "USD",
        amount: 20,
      },
    });
    const code = await requestAndReadOtp(profile.id);

    await expect(
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 10,
        otpCode: code,
      }),
    ).rejects.toThrow(/montant minimum/);

    expect(initiatePayout).not.toHaveBeenCalled();
  }, 30000);
});

describe("wallet payout: provider failure triggers refund", () => {
  test("balance is restored and transaction marked failed if MbiyoPay rejects the payout", async () => {
    const { profile } = await createApprovedSeller("provider-fail");
    const code = await requestAndReadOtp(profile.id);

    initiatePayout.mockRejectedValue(new Error("MbiyoPay network unreachable"));

    await expect(
      initiateSellerPayout({
        sellerProfileId: profile.id,
        currency: "USD",
        amount: 30,
        otpCode: code,
      }),
    ).rejects.toThrow(/MbiyoPay network unreachable/);

    const wallet = await prisma.wallet.findUnique({
      where: { sellerProfileId: profile.id },
    });
    const balance = await prisma.walletBalance.findUnique({
      where: { walletId_currency: { walletId: wallet.id, currency: "USD" } },
    });
    // Balance should be back to the starting 100 — debit was reverted.
    expect(Number(balance.balance)).toBe(100);

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
    });
    const failedDebit = transactions.find((t) => t.type === "PAYOUT_DEBIT");
    expect(failedDebit.status).toBe("FAILED");
  }, 30000);
});
