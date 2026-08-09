process.env.NODE_ENV = "test";

jest.mock(
  "../../src/features/notification/services/notification.service",
  () => ({
    createNotification: jest.fn().mockResolvedValue({
      id: "test-notification-id",
      type: "ORDER_STATUS",
      title: "Test",
      body: "Test",
      data: {},
      isRead: false,
      createdAt: new Date().toISOString(),
    }),
  }),
);
jest.mock("../../src/config/socket", () => ({
  emitToOrder: jest.fn(),
  emitToUser: jest.fn(),
  initSocket: jest.fn(),
}));
jest.mock("../../src/features/payments/services/mbioyopay.service", () => ({
  initiatePayin: jest.fn(),
  initiatePayout: jest.fn().mockResolvedValue({
    orderId: "MOCK-PAYOUT-ORDER",
    transaction_id: "MOCK-PAYOUT-TXN",
  }),
}));

const crypto = require("crypto");
const { getPrismaClient } = require("../../src/config/prisma");
const {
  acceptOrder,
  rejectOrder,
  completePickupHandoff,
  confirmOrderPayment,
} = require("../../src/features/orders/services/order.service");
const {
  initiatePayout,
} = require("../../src/features/payments/services/mbioyopay.service");

const prisma = getPrismaClient();

const RUN_ID = `concurrency-${Date.now()}`;

// Every fixture created by any test in this file is registered here so a
// single afterAll can tear all of it down, regardless of which describe
// block created it.
const createdSellerProfileIds = [];
const createdUserIds = [];
const createdCategoryIds = [];
const createdSubcategoryIds = [];

async function createTestSeller(suffix) {
  const user = await prisma.user.create({
    data: {
      name: `Test Seller ${suffix}`,
      role: "SELLER",
      emails: {
        create: {
          email: `${RUN_ID}-seller-${suffix}@example.com`,
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
      contactEmail: `${RUN_ID}-seller-${suffix}@example.com`,
      whatsappNumber: "+243900000000",
      address: "123 Test Street",
      status: "ACTIVE",
    },
  });
  createdSellerProfileIds.push(profile.id);

  const testShop = await prisma.shop.create({
    data: {
      sellerProfileId: profile.id,
      name: `Test Shop ${suffix}`,
      slug: `${RUN_ID}-shop-${suffix}`,
      description: "Test shop",
      deliveryFee: 2,
      deliveryFeeCurrency: "USD",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  return { user, profile, shop: testShop };
}

async function createTestBuyer(suffix) {
  const user = await prisma.user.create({
    data: {
      name: `Test Buyer ${suffix}`,
      role: "BUYER",
      emails: {
        create: {
          email: `${RUN_ID}-buyer-${suffix}@example.com`,
          isPrimary: true,
          isVerified: true,
        },
      },
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createVariant(shopId, stock, price = 10) {
  const category = await prisma.category.create({
    data: {
      name: `Test Category ${RUN_ID}-${Math.random()}`,
      slug: `${RUN_ID}-cat-${Math.random()}`,
    },
  });
  createdCategoryIds.push(category.id);

  const subcategory = await prisma.subcategory.create({
    data: {
      categoryId: category.id,
      name: `Test Subcategory ${Math.random()}`,
      slug: `${RUN_ID}-subcat-${Math.random()}`,
    },
  });
  createdSubcategoryIds.push(subcategory.id);

  const product = await prisma.product.create({
    data: {
      shopId,
      subcategoryId: subcategory.id,
      name: `Test Product ${Math.random()}`,
      slug: `${RUN_ID}-prod-${Math.random()}`,
      description: "Test product",
      currency: "USD",
      status: "PUBLISHED",
    },
  });
  return prisma.productVariant.create({
    data: { productId: product.id, price, stock, isDefault: true },
  });
}

async function createOrder({
  buyerId,
  shopId,
  variantId,
  quantity,
  unitPrice,
  paymentMethod = "CASH_ON_DELIVERY",
  paymentStatus,
}) {
  const subtotal = unitPrice * quantity;
  const total = subtotal;
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  const order = await prisma.order.create({
    data: {
      buyerId,
      shopId,
      paymentMethod,
      fulfillmentMethod: "PICKUP",
      status: "PENDING_SELLER_REVIEW",
      currency: "USD",
      subtotal,
      deliveryFee: 0,
      total,
      qrToken: crypto.randomBytes(24).toString("hex"),
      items: {
        create: {
          productId: variant.productId,
          variantId,
          productName: "Test Product",
          unitPrice,
          quantity,
          subtotal,
        },
      },
    },
  });

  if (paymentMethod === "ONLINE_PAYMENT") {
    await prisma.orderPayment.create({
      data: {
        orderId: order.id,
        amount: total,
        currency: "USD",
        status: paymentStatus || "SUCCEEDED",
      },
    });
  }

  return order;
}

afterAll(async () => {
  try {
    for (const sellerProfileId of createdSellerProfileIds) {
      const shops = await prisma.shop.findMany({ where: { sellerProfileId } });
      for (const s of shops) {
        const orders = await prisma.order.findMany({
          where: { shopId: s.id },
          select: { id: true },
        });
        const orderIds = orders.map((o) => o.id);
        if (orderIds.length) {
          await prisma.walletTransaction.deleteMany({
            where: { orderId: { in: orderIds } },
          });
          await prisma.orderItem.deleteMany({
            where: { orderId: { in: orderIds } },
          });
          await prisma.orderPayment.deleteMany({
            where: { orderId: { in: orderIds } },
          });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }

        const products = await prisma.product.findMany({
          where: { shopId: s.id },
          select: { id: true },
        });
        const productIds = products.map((p) => p.id);
        if (productIds.length) {
          const variants = await prisma.productVariant.findMany({
            where: { productId: { in: productIds } },
            select: { id: true },
          });
          const variantIds = variants.map((v) => v.id);
          if (variantIds.length) {
            await prisma.stockMovement.deleteMany({
              where: { variantId: { in: variantIds } },
            });
          }
          await prisma.productVariant.deleteMany({
            where: { productId: { in: productIds } },
          });
          await prisma.product.deleteMany({
            where: { id: { in: productIds } },
          });
        }
      }
      await prisma.shop.deleteMany({ where: { sellerProfileId } });

      const wallet = await prisma.wallet.findUnique({
        where: { sellerProfileId },
      });
      if (wallet) {
        await prisma.walletBalance.deleteMany({
          where: { walletId: wallet.id },
        });
        await prisma.wallet.delete({ where: { id: wallet.id } });
      }

      await prisma.sellerProfile
        .delete({ where: { id: sellerProfileId } })
        .catch(() => {});
    }

    for (const subcategoryId of createdSubcategoryIds) {
      await prisma.subcategory
        .delete({ where: { id: subcategoryId } })
        .catch(() => {});
    }
    for (const categoryId of createdCategoryIds) {
      await prisma.category
        .delete({ where: { id: categoryId } })
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

describe("order concurrency: stock overselling", () => {
  test("only one of two concurrent acceptOrder calls succeeds when stock=1", async () => {
    const { profile: sellerProfile, shop } = await createTestSeller("stock");
    const buyer = await createTestBuyer("stock");
    const variant = await createVariant(shop.id, 1, 10);

    const orderA = await createOrder({
      buyerId: buyer.id,
      shopId: shop.id,
      variantId: variant.id,
      quantity: 1,
      unitPrice: 10,
    });
    const orderB = await createOrder({
      buyerId: buyer.id,
      shopId: shop.id,
      variantId: variant.id,
      quantity: 1,
      unitPrice: 10,
    });

    const results = await Promise.allSettled([
      acceptOrder(orderA.id, sellerProfile.id),
      acceptOrder(orderB.id, sellerProfile.id),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toMatch(/[Ss]tock insuffisant/);

    const finalVariant = await prisma.productVariant.findUnique({
      where: { id: variant.id },
    });
    expect(finalVariant.stock).toBe(0);

    const movements = await prisma.stockMovement.findMany({
      where: { variantId: variant.id },
    });
    expect(movements).toHaveLength(1);
  }, 30000);
});

describe("order concurrency: wallet double-credit on duplicate QR scan", () => {
  test("only one of two concurrent completePickupHandoff calls credits the wallet", async () => {
    const { profile: sellerProfile, shop } = await createTestSeller("wallet");
    const buyer = await createTestBuyer("wallet");
    const variant = await createVariant(shop.id, 10, 25);

    const order = await createOrder({
      buyerId: buyer.id,
      shopId: shop.id,
      variantId: variant.id,
      quantity: 1,
      unitPrice: 25,
      paymentMethod: "ONLINE_PAYMENT",
      paymentStatus: "SUCCEEDED",
    });

    // Move it straight to READY_FOR_PICKUP so completePickupHandoff's
    // transition check passes (mirrors accept -> ready that would have
    // already happened in the real flow).
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "READY_FOR_PICKUP" },
    });

    const results = await Promise.allSettled([
      completePickupHandoff(order.id, sellerProfile.id, order.qrToken),
      completePickupHandoff(order.id, sellerProfile.id, order.qrToken),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason.message).toMatch(/QR a déjà été scanné/);

    const wallet = await prisma.wallet.findUnique({
      where: { sellerProfileId: sellerProfile.id },
    });
    expect(wallet).not.toBeNull();

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, orderId: order.id },
    });
    expect(transactions).toHaveLength(1);

    const balance = await prisma.walletBalance.findUnique({
      where: { walletId_currency: { walletId: wallet.id, currency: "USD" } },
    });
    expect(Number(balance.balance)).toBe(25);

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(finalOrder.status).toBe("COMPLETED");
  }, 30000);
});

describe("order concurrency: refund idempotency", () => {
  test("concurrent reject attempts on the same order only trigger one payout", async () => {
    const { profile: sellerProfile, shop } = await createTestSeller("refund");
    const buyer = await createTestBuyer("refund");
    const variant = await createVariant(shop.id, 10, 15);

    const order = await createOrder({
      buyerId: buyer.id,
      shopId: shop.id,
      variantId: variant.id,
      quantity: 1,
      unitPrice: 15,
      paymentMethod: "ONLINE_PAYMENT",
      paymentStatus: "SUCCEEDED",
    });

    initiatePayout.mockClear();

    const results = await Promise.allSettled([
      rejectOrder(order.id, sellerProfile.id, "out of stock"),
      rejectOrder(order.id, sellerProfile.id, "out of stock"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    expect(fulfilled).toHaveLength(1);

    expect(initiatePayout).toHaveBeenCalledTimes(1);

    const payment = await prisma.orderPayment.findUnique({
      where: { orderId: order.id },
    });
    expect(payment.status).toBe("REFUNDED");
  }, 30000);
});

describe("order concurrency: duplicate MbiyoPay payin webhook delivery", () => {
  test("two concurrent confirmOrderPayment calls for the same callback only transition the order once", async () => {
    const { profile: sellerProfile, shop } = await createTestSeller("payin");
    const buyer = await createTestBuyer("payin");
    const variant = await createVariant(shop.id, 10, 20);

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        shopId: shop.id,
        paymentMethod: "ONLINE_PAYMENT",
        fulfillmentMethod: "PICKUP",
        status: "AWAITING_PAYMENT",
        currency: "USD",
        subtotal: 20,
        deliveryFee: 0,
        total: 20,
        qrToken: crypto.randomBytes(24).toString("hex"),
        items: {
          create: {
            productId: variant.productId,
            variantId: variant.id,
            productName: "Test Product",
            unitPrice: 20,
            quantity: 1,
            subtotal: 20,
          },
        },
      },
    });

    const transactionId = `${RUN_ID}-payin-txn`;
    const payinOrderId = `SWG-ORD-${order.id}`;

    await prisma.orderPayment.create({
      data: {
        orderId: order.id,
        amount: 20,
        currency: "USD",
        status: "PENDING",
        payinOrderId,
        payinTransactionId: transactionId,
      },
    });

    // Simulates MbiyoPay redelivering the same "successful" callback twice
    // (its own retry policy can do this) before the first delivery's DB
    // write has landed — the exact race confirmOrderPayment's atomic
    // updateMany claim guards against.
    const results = await Promise.allSettled([
      confirmOrderPayment(transactionId, payinOrderId),
      confirmOrderPayment(transactionId, payinOrderId),
    ]);

    expect(results.every((r) => r.status === "fulfilled")).toBe(true);

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(finalOrder.status).toBe("PENDING_SELLER_REVIEW");

    const finalPayment = await prisma.orderPayment.findUnique({
      where: { orderId: order.id },
    });
    expect(finalPayment.status).toBe("SUCCEEDED");
  }, 30000);
});
