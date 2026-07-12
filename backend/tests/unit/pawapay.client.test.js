const nock = require("nock");
const crypto = require("crypto");
const {
  pawapayRequest,
} = require("../../src/features/pawapay/utils/pawapay.client");
const {
  pawapayConfig,
} = require("../../src/features/pawapay/config/pawapay.config");
const {
  verifyBase,
  parseSignatureInputHeader,
  buildRequestSignatureBase,
  extractSignatureFromHeader,
} = require("../../src/features/pawapay/utils/signature.util");
const {
  verifyContentDigest,
} = require("../../src/features/pawapay/utils/content-digest.util");

describe("pawapay.client", () => {
  const publicKey = crypto.createPublicKey(pawapayConfig.privateKey);

  afterEach(() => nock.cleanAll());

  test("sends correct Authorization Bearer header", async () => {
    let capturedHeaders;
    nock("https://api.sandbox.pawapay.io")
      .get("/v2/active-conf")
      .reply(function () {
        capturedHeaders = this.req.headers;
        return [200, {}];
      });
    await pawapayRequest("GET", "/v2/active-conf", null);
    expect(capturedHeaders.authorization).toBe("Bearer test_token");
  });

  test("does not sign GET requests even when signedRequests=true", async () => {
    let capturedHeaders;
    nock("https://api.sandbox.pawapay.io")
      .get("/v2/active-conf")
      .reply(function () {
        capturedHeaders = this.req.headers;
        return [200, {}];
      });
    await pawapayRequest("GET", "/v2/active-conf", null);
    expect(capturedHeaders.signature).toBeUndefined();
  });

  test("signs POST requests with a cryptographically valid signature", async () => {
    let capturedHeaders;
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/deposits")
      .reply(function (uri, body) {
        capturedHeaders = this.req.headers;
        return [200, { depositId: body.depositId, status: "ACCEPTED" }];
      });

    const requestBody = {
      depositId: "f4401bd2-1568-4140-bf2d-eb77d2b2b639",
      amount: "15",
      currency: "USD",
    };
    const result = await pawapayRequest("POST", "/v2/deposits", requestBody);

    expect(result.status).toBe("ACCEPTED");
    expect(capturedHeaders["content-digest"]).toBeDefined();
    expect(
      verifyContentDigest(
        JSON.stringify(requestBody),
        capturedHeaders["content-digest"],
      ),
    ).toBe(true);

    const parsedInput = parseSignatureInputHeader(
      capturedHeaders["signature-input"],
    );
    const reconstructedBase = buildRequestSignatureBase({
      method: "POST",
      authority: "api.sandbox.pawapay.io",
      path: "/v2/deposits",
      signatureDate: capturedHeaders["signature-date"],
      contentDigest: capturedHeaders["content-digest"],
      contentType: "application/json; charset=UTF-8",
      created: parsedInput.created,
      expires: parsedInput.expires,
      keyId: parsedInput.keyid,
      alg: parsedInput.alg,
    });
    const sig = extractSignatureFromHeader(capturedHeaders["signature"]);
    expect(verifyBase(reconstructedBase, sig, publicKey)).toBe(true);
  });

  test("throws AppError with PawaPay's message on a 4xx response", async () => {
    nock("https://api.sandbox.pawapay.io")
      .post("/v2/deposits")
      .reply(400, { errorMessage: "Invalid provider code" });
    await expect(
      pawapayRequest("POST", "/v2/deposits", { depositId: "x" }),
    ).rejects.toMatchObject({
      code: "PAWAPAY_REQUEST_FAILED",
      statusCode: 502,
    });
  });

  test("throws AppError on network failure", async () => {
    nock.cleanAll();
    nock.enableNetConnect();
    const originalBaseUrl = pawapayConfig.baseUrl;
    pawapayConfig.baseUrl = "http://127.0.0.1:1"; // port 1 is never listening
    try {
      await expect(
        pawapayRequest("POST", "/v2/deposits", { depositId: "x" }),
      ).rejects.toMatchObject({ code: "PAWAPAY_UNREACHABLE", statusCode: 503 });
    } finally {
      pawapayConfig.baseUrl = originalBaseUrl;
    }
  });
});
