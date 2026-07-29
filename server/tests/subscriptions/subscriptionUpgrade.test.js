process.env.NODE_ENV = "test";

jest.mock("../../src/features/notification/services/notification.service", () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock("../../src/features/invoicing/services/invoice.service", () => ({
  generateInvoiceDocument: jest.fn().mockResolvedValue({
    record: { documentNumber: "TEST-DOC-0001" },
    pdfBuffer: null,
  }),
  generateReceiptDocument: jest.fn().mockResolvedValue({
    record: { documentNumber: "TEST-DOC-0002" },
    pdfBuffer: null,
  }),
}));
jest.mock("../../src/features/payments/services/pawapay.service", () => ({
  initiateDeposit: jest.fn().mockResolvedValue({
    depositId: "mock-will-be-overridden",
    status: "ACCEPTED",
  }),
}));

const { getPrismaClient } = require("../../src/config/prisma");
const {
  upgradeSubscription,
} = require("../../src/features/subscriptions/services/subscription.service");
const {
  initiateDeposit,
} = require("../../src/features/payments/services/pawapay.service");

const prisma = getPrismaClient();
const RUN_ID = `sub-upgrade-${Date.now()}`;

let sellerProfileId;
let cheapPlanId;
let expensivePlanId;
let subscriptionId;
const createdUserIds = [];

beforeAll(async () => {
  // initiateDeposit should echo back whatever depositId it was called with
  // (matching the real implementation's idempotency contract from Phase 9).
  initiateDeposit.mockImplementation(async ({ depositId }) => ({
    depositId,
    status: "ACCEPTED",
  }));

  const user = await prisma.user.create({
    data: {
      name: "Test Upgrade Seller",
      role: "SELLER",
      emails: {
        create: {
          email: `${RUN_ID}-seller@example.com`,
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
      businessName: "Test Upgrade Business",
      businessDescription: "Test",
      logoUrl: "https://example.com/logo.png",
      logoPublicId: "logo-public-id",
      bannerUrl: "https://example.com/banner.png",
      bannerPublicId: "banner-public-id",
      contactPhone: "+243900000000",
      contactEmail: `${RUN_ID}-seller@example.com`,
      whatsappNumber: "+243900000000",
      address: "123 Test Street",
      status: "ACTIVE",
    },
  });
  sellerProfileId = profile.id;

  const cheapPlan = await prisma.plan.create({
    data: {
      name: `Test Starter ${RUN_ID}`,
      slug: `test-starter-${RUN_ID}`,
      maxProducts: 10,
      maxPhotosPerProduct: 3,
      prices: {
        create: { billingCycle: "MONTHLY", currency: "USD", amount: 5 },
      },
    },
  });
  cheapPlanId = cheapPlan.id;

  const expensivePlan = await prisma.plan.create({
    data: {
      name: `Test Business ${RUN_ID}`,
      slug: `test-business-${RUN_ID}`,
      maxProducts: 100,
      maxPhotosPerProduct: 10,
      prices: {
        create: { billingCycle: "MONTHLY", currency: "USD", amount: 20 },
      },
    },
  });
  expensivePlanId = expensivePlan.id;

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      sellerProfileId,
      planId: cheapPlanId,
      billingCycle: "MONTHLY",
      currency: "USD",
      status: "ACTIVE",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });
  subscriptionId = subscription.id;
});

afterAll(async () => {
  await prisma.subscriptionPayment.deleteMany({ where: { subscriptionId } }).catch(() => {});
  await prisma.subscription.delete({ where: { id: subscriptionId } }).catch(() => {});
  await prisma.planPrice.deleteMany({ where: { planId: { in: [cheapPlanId, expensivePlanId] } } }).catch(() => {});
  await prisma.plan.deleteMany({ where: { id: { in: [cheapPlanId, expensivePlanId] } } }).catch(() => {});
  await prisma.sellerProfile.delete({ where: { id: sellerProfileId } }).catch(() => {});
  for (const userId of createdUserIds) {
    await prisma.userEmail.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  }
  await prisma.$disconnect();
}, 30000);

describe("upgradeSubscription", () => {
  test("does not throw ReferenceError and creates a payment for the NEW plan/price", async () => {
    const result = await upgradeSubscription({
      sellerProfileId,
      newPlanId: expensivePlanId,
      billingCycle: "MONTHLY",
      currency: "USD",
      payerPhoneNumber: "243900000001",
      country: "CD",
      provider: "vodacom",
    });

    expect(result.payment).toBeDefined();
    expect(result.payment.planId).toBe(expensivePlanId);
    expect(Number(result.payment.amount)).toBe(20);
    expect(result.payment.status).toBe("PENDING");

    // The deposit's id must be the internal payment record's own id
    // (deterministic idempotency key), not an unrelated fresh UUID.
    expect(result.deposit.depositId).toBe(result.payment.id);
  });

  test("rejects a second upgrade attempt while the first payment is still PENDING", async () => {
    await expect(
      upgradeSubscription({
        sellerProfileId,
        newPlanId: expensivePlanId,
        billingCycle: "MONTHLY",
        currency: "USD",
        payerPhoneNumber: "243900000001",
        country: "CD",
        provider: "vodacom",
      }),
    ).rejects.toThrow(/paiement est déjà en attente/i);
  });
});
