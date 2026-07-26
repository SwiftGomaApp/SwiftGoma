process.env.NODE_ENV = "test";

const crypto = require("crypto");

describe("pawapay webhook signature verification (fail-closed)", () => {
  let verifyInboundSignature;
  let computeContentDigest;
  let privateKey;
  let publicKey;
  const KEY_ID = "TEST_KEY:1";
  const URL = "https://api.swiftgoma.test/api/v1/pawapay/callbacks/deposit";

  beforeAll(() => {
    const keyPair = crypto.generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;

    process.env.PAWAPAY_ENVIRONMENT = "sandbox";
    process.env.PAWAPAY_CALLBACK_BASE_URL = "https://api.swiftgoma.test";
    process.env.PAWAPAY_SANDBOX_PRIVATE_KEY_PEM = Buffer.from(
      privateKey.export({ type: "pkcs8", format: "pem" }),
    ).toString("base64");
    process.env.PAWAPAY_SANDBOX_PUBLIC_KEY_PEM = Buffer.from(
      publicKey.export({ type: "spki", format: "pem" }),
    ).toString("base64");
    process.env.PAWAPAY_SANDBOX_KEY_ID = KEY_ID;
    process.env.PAWAPAY_SIGNING_ENABLED = "true";

    jest.resetModules();
    ({ verifyInboundSignature, computeContentDigest } = require(
      "../../src/features/payments/utils/pawapay.signature",
    ));
  });

  async function signBody(bodyString) {
    const { httpbis } = require("http-message-signatures");
    const contentDigest = computeContentDigest(bodyString);

    const signed = await httpbis.signMessage(
      {
        key: {
          id: KEY_ID,
          alg: "ecdsa-p256-sha256",
          async sign(data) {
            return crypto.createSign("SHA256").update(data).sign(privateKey);
          },
        },
        name: "sig-pp",
        fields: [
          "@method",
          "@authority",
          "@path",
          "signature-date",
          "content-digest",
          "content-type",
          "content-length",
        ],
      },
      {
        method: "POST",
        url: URL,
        headers: {
          "Signature-Date": new Date().toISOString(),
          "Content-Type": "application/json",
          "Content-Digest": contentDigest,
          "Content-Length": Buffer.byteLength(bodyString).toString(),
        },
        body: bodyString,
      },
    );

    const lowerHeaders = {};
    for (const [k, v] of Object.entries(signed.headers)) {
      lowerHeaders[k.toLowerCase()] = v;
    }
    return lowerHeaders;
  }

  test("accepts a validly signed callback", async () => {
    const bodyString = JSON.stringify({ depositId: "abc-123", status: "COMPLETED" });
    const headers = await signBody(bodyString);

    const result = await verifyInboundSignature({
      method: "POST",
      url: URL,
      headers,
      bodyBuffer: Buffer.from(bodyString),
    });

    expect(result).toBe(true);
  });

  test("rejects a callback whose body was tampered with after signing", async () => {
    const bodyString = JSON.stringify({ depositId: "abc-123", status: "COMPLETED" });
    const headers = await signBody(bodyString);

    const tamperedBody = JSON.stringify({
      depositId: "abc-123",
      status: "COMPLETED_BUT_FORGED",
    });

    const result = await verifyInboundSignature({
      method: "POST",
      url: URL,
      headers,
      bodyBuffer: Buffer.from(tamperedBody),
    });

    expect(result).toBe(false);
  });

  test("rejects a callback with no signature headers at all (unsigned/forged request)", async () => {
    const bodyString = JSON.stringify({ depositId: "abc-123", status: "COMPLETED" });

    const result = await verifyInboundSignature({
      method: "POST",
      url: URL,
      headers: { "content-type": "application/json" },
      bodyBuffer: Buffer.from(bodyString),
    });

    expect(result).toBe(false);
  });

  test("rejects a malformed Content-Digest header", async () => {
    const bodyString = JSON.stringify({ depositId: "abc-123", status: "COMPLETED" });
    const headers = await signBody(bodyString);
    headers["content-digest"] = "not-a-real-digest";

    const result = await verifyInboundSignature({
      method: "POST",
      url: URL,
      headers,
      bodyBuffer: Buffer.from(bodyString),
    });

    expect(result).toBe(false);
  });

  test("fails closed when no public key is configured for the environment", async () => {
    const bodyString = JSON.stringify({ depositId: "abc-123", status: "COMPLETED" });
    const headers = await signBody(bodyString);

    delete process.env.PAWAPAY_SANDBOX_PUBLIC_KEY_PEM;
    jest.resetModules();
    const { verifyInboundSignature: verifyWithNoKey } = require(
      "../../src/features/payments/utils/pawapay.signature",
    );

    const result = await verifyWithNoKey({
      method: "POST",
      url: URL,
      headers,
      bodyBuffer: Buffer.from(bodyString),
    });

    expect(result).toBe(false);

    // restore for any subsequent tests in this file
    process.env.PAWAPAY_SANDBOX_PUBLIC_KEY_PEM = Buffer.from(
      publicKey.export({ type: "spki", format: "pem" }),
    ).toString("base64");
  });
});

describe("mbiyopay webhook signature verification (fail-closed)", () => {
  let verifyWebhookSignature;

  function loadWithSecret(secret) {
    if (secret === undefined) {
      delete process.env.MBIYOPAY_WEBHOOK_SECRET;
    } else {
      process.env.MBIYOPAY_WEBHOOK_SECRET = secret;
    }
    jest.resetModules();
    ({ verifyWebhookSignature } = require(
      "../../src/features/payments/utils/mbiyopay.utils",
    ));
  }

  test("fails closed (rejects) when MBIYOPAY_WEBHOOK_SECRET is not configured", () => {
    loadWithSecret(undefined);
    const body = Buffer.from(JSON.stringify({ transaction_id: "t1", status: "successful" }));
    const someSignature = crypto.createHmac("sha256", "irrelevant").update(body).digest("hex");

    expect(verifyWebhookSignature(body, someSignature)).toBe(false);
  });

  test("accepts a validly signed callback when the secret is configured", () => {
    loadWithSecret("a-real-webhook-secret");
    const body = Buffer.from(JSON.stringify({ transaction_id: "t1", status: "successful" }));
    const signature = crypto
      .createHmac("sha256", "a-real-webhook-secret")
      .update(body)
      .digest("hex");

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  test("rejects an incorrect signature", () => {
    loadWithSecret("a-real-webhook-secret");
    const body = Buffer.from(JSON.stringify({ transaction_id: "t1", status: "successful" }));

    expect(verifyWebhookSignature(body, "ff".repeat(32))).toBe(false);
  });

  test("rejects a missing signature header", () => {
    loadWithSecret("a-real-webhook-secret");
    const body = Buffer.from(JSON.stringify({ transaction_id: "t1", status: "successful" }));

    expect(verifyWebhookSignature(body, undefined)).toBe(false);
  });
});
