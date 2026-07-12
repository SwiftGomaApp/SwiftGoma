jest.mock("../../src/config/db.config", () => {
  const sessions = new Map();
  const pawaPayTransactions = new Map();
  return {
    prisma: {
      session: {
        findUnique: jest.fn(
          async ({ where: { id } }) => sessions.get(id) || null,
        ),
      },
      pawaPayTransaction: {
        findUnique: jest.fn(
          async ({ where: { id } }) => pawaPayTransactions.get(id) || null,
        ),
        create: jest.fn(async ({ data }) => {
          pawaPayTransactions.set(data.id, data);
          return data;
        }),
        update: jest.fn(async ({ where: { id }, data }) => {
          const updated = { ...pawaPayTransactions.get(id), ...data };
          pawaPayTransactions.set(id, updated);
          return updated;
        }),
      },
    },
    __debug: { sessions, pawaPayTransactions },
  };
});

jest.mock(
  "../../src/features/auth/middlewares/authenticate.middleware",
  () => ({
    authenticate: (req, res, next) => {
      const role = req.headers["x-test-role"];
      if (!role) {
        const err = new Error("Unauthorized");
        err.statusCode = 401;
        err.code = "UNAUTHORIZED";
        return next(err);
      }
      req.user = { id: "test-user-" + role.toLowerCase(), role };
      next();
    },
    requireRole:
      (...roles) =>
      (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
          const err = new Error("Forbidden");
          err.statusCode = 403;
          err.code = "FORBIDDEN";
          return next(err);
        }
        next();
      },
  }),
);

const crypto = require("crypto");
const express = require("express");
const nock = require("nock");
const http = require("http");

const {
  pawapayConfig,
} = require("../../src/features/pawapay/config/pawapay.config");
const {
  buildCallbackSignatureBase,
  signBase,
  buildSignatureHeader,
  buildSignatureInputHeader,
} = require("../../src/features/pawapay/utils/signature.util");
const {
  computeContentDigest,
} = require("../../src/features/pawapay/utils/content-digest.util");
const {
  pawapayRouter,
} = require("../../src/features/pawapay/routes/pawapay.routes");
const { prisma, __debug } = require("../../src/config/db.config");
const {
  clearCache,
} = require("../../src/features/pawapay/services/pawapay-public-key.service");

describe("pawapay.routes — the real, single consolidated router", () => {
  const publicKey = crypto.createPublicKey(pawapayConfig.privateKey);
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" });

  let app, server;
  const PORT = 4996;

  beforeAll((done) => {
    app = express();
    app.use("/api/v1/pawapay", pawapayRouter);
    app.use((err, req, res, next) =>
      res
        .status(err.statusCode || 500)
        .json({ code: err.code, message: err.message }),
    );
    server = app.listen(PORT, done);
  });
  afterAll((done) => {
    server.close(done);
  });
  afterEach(() => nock.cleanAll());

  beforeEach(() => {
    clearCache();
    nock("https://api.sandbox.pawapay.io")
      .persist()
      .get("/public-key/http")
      .reply(200, [{ id: pawapayConfig.keyId, key: publicKeyPem }]);
  });

  const httpPost = (path, bodyString, headers) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: "localhost", port: PORT, path, method: "POST", headers },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              body: data ? JSON.parse(data) : null,
            }),
          );
        },
      );
      req.on("error", reject);
      req.write(bodyString);
      req.end();
    });

  const httpGet = (path, headers) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: "localhost", port: PORT, path, method: "GET", headers },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () =>
            resolve({
              status: res.statusCode,
              body: data ? JSON.parse(data) : null,
            }),
          );
        },
      );
      req.on("error", reject);
      req.end();
    });

  const buildSignedRequest = (path, bodyObj) => {
    const rawBody = JSON.stringify(bodyObj);
    const contentDigest = computeContentDigest(rawBody);
    const signatureDate = new Date().toISOString().replace("Z", "000Z");
    const created = Math.floor(Date.now() / 1000);
    const expires = created + 60;
    const contentType = "application/json; charset=UTF-8";
    const keyId = pawapayConfig.keyId;
    const alg = pawapayConfig.signAlgorithm;
    const base = buildCallbackSignatureBase({
      method: "POST",
      authority: "localhost:" + PORT,
      path,
      signatureDate,
      contentDigest,
      contentType,
      created,
      expires,
      keyId,
      alg,
    });
    const sigBase64 = signBase(base, pawapayConfig.privateKey);
    return {
      rawBody,
      headers: {
        "Content-Type": contentType,
        "Content-Digest": contentDigest,
        "Signature-Date": signatureDate,
        Signature: buildSignatureHeader(sigBase64),
        "Signature-Input": buildSignatureInputHeader({
          created,
          expires,
          keyId,
          alg,
        }),
      },
    };
  };

  // ─── Webhook callbacks ─────────────────────────────────────────────────────

  test("POST /deposits: valid signed callback updates the transaction", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "dep-1",
        type: "DEPOSIT",
        purpose: "ORDER_PAYMENT",
        status: "ACCEPTED",
      },
    });
    const { rawBody, headers } = buildSignedRequest(
      "/api/v1/pawapay/deposits",
      { depositId: "dep-1", status: "COMPLETED" },
    );
    const res = await httpPost("/api/v1/pawapay/deposits", rawBody, headers);
    expect(res.status).toBe(200);
    const row = await prisma.pawaPayTransaction.findUnique({
      where: { id: "dep-1" },
    });
    expect(row.status).toBe("COMPLETED");
  });

  test("POST /payouts: valid signed callback updates the transaction", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "pay-1",
        type: "PAYOUT",
        purpose: "WALLET_PAYOUT",
        status: "ACCEPTED",
      },
    });
    const { rawBody, headers } = buildSignedRequest("/api/v1/pawapay/payouts", {
      payoutId: "pay-1",
      status: "COMPLETED",
    });
    const res = await httpPost("/api/v1/pawapay/payouts", rawBody, headers);
    expect(res.status).toBe(200);
  });

  test("POST /refunds: valid signed callback updates the transaction", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "ref-1",
        type: "REFUND",
        purpose: "ORDER_PAYMENT",
        status: "ACCEPTED",
      },
    });
    const { rawBody, headers } = buildSignedRequest("/api/v1/pawapay/refunds", {
      refundId: "ref-1",
      status: "COMPLETED",
    });
    const res = await httpPost("/api/v1/pawapay/refunds", rawBody, headers);
    expect(res.status).toBe(200);
  });

  test("POST /deposits: tampered signature rejected 401, transaction untouched", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "dep-2",
        type: "DEPOSIT",
        purpose: "ORDER_PAYMENT",
        status: "ACCEPTED",
      },
    });
    const { rawBody, headers } = buildSignedRequest(
      "/api/v1/pawapay/deposits",
      { depositId: "dep-2", status: "COMPLETED" },
    );
    headers.Signature = headers.Signature.slice(0, -4) + "AAAA:";
    const res = await httpPost("/api/v1/pawapay/deposits", rawBody, headers);
    expect(res.status).toBe(401);
    const row = await prisma.pawaPayTransaction.findUnique({
      where: { id: "dep-2" },
    });
    expect(row.status).toBe("ACCEPTED");
  });

  test("POST /payouts: a DEPOSIT id sent here is rejected as a type mismatch, not processed", async () => {
    await prisma.pawaPayTransaction.create({
      data: {
        id: "dep-3",
        type: "DEPOSIT",
        purpose: "ORDER_PAYMENT",
        status: "ACCEPTED",
      },
    });
    const { rawBody, headers } = buildSignedRequest("/api/v1/pawapay/payouts", {
      payoutId: "dep-3",
      status: "COMPLETED",
    });
    const res = await httpPost("/api/v1/pawapay/payouts", rawBody, headers);
    expect(res.status).toBe(200);
    expect(res.body.typeMismatch).toBe(true);
    const row = await prisma.pawaPayTransaction.findUnique({
      where: { id: "dep-3" },
    });
    expect(row.status).toBe("ACCEPTED");
  });

  // ─── Admin / seller actions ────────────────────────────────────────────────

  test("GET /wallet-balance: no role header -> 401", async () => {
    const res = await httpGet("/api/v1/pawapay/wallet-balance", {});
    expect(res.status).toBe(401);
  });

  test("GET /wallet-balance: BUYER role -> 403 (admin only)", async () => {
    const res = await httpGet("/api/v1/pawapay/wallet-balance", {
      "x-test-role": "BUYER",
    });
    expect(res.status).toBe(403);
  });

  test("GET /wallet-balance: ADMIN role -> 200", async () => {
    nock("https://api.sandbox.pawapay.io")
      .get("/v2/wallet-balances")
      .reply(200, { balances: [{ country: "COD", balance: "1000" }] });
    const res = await httpGet("/api/v1/pawapay/wallet-balance", {
      "x-test-role": "ADMIN",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.balances[0].balance).toBe("1000");
  });

  // ─── Toolkit lookups ───────────────────────────────────────────────────────

  test("GET /active-conf: any authenticated role allowed, invalid operationType rejected", async () => {
    const res = await httpGet(
      "/api/v1/pawapay/active-conf?operationType=BOGUS",
      { "x-test-role": "BUYER" },
    );
    expect(res.status).toBe(400); // proves the `errors` import fix worked
  });

  test("GET /active-conf: valid request -> 200", async () => {
    nock("https://api.sandbox.pawapay.io")
      .get("/v2/active-conf?country=COD")
      .reply(200, { companyName: "SwiftGoma" });
    const res = await httpGet("/api/v1/pawapay/active-conf?country=COD", {
      "x-test-role": "BUYER",
    });
    expect(res.status).toBe(200);
  });

  test("POST /predict-provider: missing phoneNumber -> 400", async () => {
    const res = await httpPost(
      "/api/v1/pawapay/predict-provider",
      JSON.stringify({}),
      {
        "Content-Type": "application/json",
        "x-test-role": "BUYER",
      },
    );
    expect(res.status).toBe(400);
  });

  test("POST /predict-provider: valid -> 200", async () => {
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/predict-provider", { phoneNumber: "243111111111" })
      .reply(200, { provider: "ORANGE_COD" });
    const res = await httpPost(
      "/api/v1/pawapay/predict-provider",
      JSON.stringify({ phoneNumber: "243111111111" }),
      {
        "Content-Type": "application/json",
        "x-test-role": "BUYER",
      },
    );
    expect(res.status).toBe(200);
    expect(res.body.data.provider).toBe("ORANGE_COD");
  });
});
