jest.mock("../../src/config/db.config", () => {
  const transactions = new Map();
  return {
    prisma: {
      pawaPayTransaction: {
        findUnique: jest.fn(
          async ({ where: { id } }) => transactions.get(id) || null,
        ),
        create: jest.fn(async ({ data }) => {
          transactions.set(data.id, data);
          return data;
        }),
        update: jest.fn(async ({ where: { id }, data }) => {
          const updated = { ...transactions.get(id), ...data };
          transactions.set(id, updated);
          return updated;
        }),
      },
    },
    __debug: { transactions },
  };
});

const nock = require("nock");
const svc = require("../../src/features/pawapay/services/pawapay.service");
const { prisma, __debug } = require("../../src/config/db.config");

describe("pawapay.service (real file from uploaded zip, post-fix)", () => {
  afterEach(() => nock.cleanAll());

  test("initiateDeposit: creates row before calling PawaPay, updates to ACCEPTED", async () => {
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/deposits")
      .reply(function (uri, body) {
        const existing = __debug.transactions.get(body.depositId);
        expect(existing).toBeDefined();
        expect(existing.status).toBe("PENDING");
        return [200, { depositId: body.depositId, status: "ACCEPTED" }];
      });

    const result = await svc.initiateDeposit({
      purpose: "ORDER_PAYMENT",
      amount: "15000",
      currency: "CDF",
      correspondent: "ORANGE_COD",
      country: "COD",
      phoneNumber: "243111111111",
      clientReferenceId: "ORDER-1",
      orderId: "order-1",
    });
    expect(result.status).toBe("ACCEPTED");
  });

  test("initiateDeposit: validates missing linked id", async () => {
    await expect(
      svc.initiateDeposit({
        purpose: "SUBSCRIPTION",
        amount: "1",
        currency: "USD",
        correspondent: "X",
        country: "COD",
        phoneNumber: "1",
        clientReferenceId: "x",
      }),
    ).rejects.toMatchObject({ code: "MISSING_LINKED_ID" });
  });

  test("initiatePayout: full flow", async () => {
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/payouts")
      .reply(200, (uri, body) => ({
        payoutId: body.payoutId,
        status: "ACCEPTED",
      }));
    const result = await svc.initiatePayout({
      amount: "5000",
      currency: "CDF",
      correspondent: "AIRTEL_COD",
      country: "COD",
      phoneNumber: "243222222222",
      clientReferenceId: "PAYOUT-1",
      sellerProfileId: "seller-1",
    });
    expect(result.purpose).toBe("WALLET_PAYOUT");
  });

  test("initiateRefund: inherits purpose + orderId from original COMPLETED deposit", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "dep-x",
        type: "DEPOSIT",
        purpose: "ORDER_PAYMENT",
        status: "COMPLETED",
        amount: "1000",
        currency: "CDF",
        correspondent: "ORANGE_COD",
        country: "COD",
        phoneNumber: "1",
        orderId: "order-99",
      },
    });
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/refunds")
      .reply(200, (uri, body) => ({
        refundId: body.refundId,
        status: "ACCEPTED",
      }));
    const result = await svc.initiateRefund({ depositId: "dep-x" });
    expect(result.orderId).toBe("order-99");
  });

  test("syncTransactionStatus: no-ops on already-terminal transaction", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "dep-done",
        type: "DEPOSIT",
        purpose: "ORDER_PAYMENT",
        status: "COMPLETED",
      },
    });
    const result = await svc.syncTransactionStatus("dep-done");
    expect(result.status).toBe("COMPLETED");
  });

  test("getWalletBalances: correct query string", async () => {
    nock("https://api.sandbox.pawapay.io")
      .get("/v2/wallet-balances?country=COD")
      .reply(200, { balances: [{ country: "COD", balance: "500" }] });
    const result = await svc.getWalletBalances("COD");
    expect(result.balances[0].balance).toBe("500");
  });
});
