const crypto = require("crypto");
const {
  buildRequestSignatureBase,
  signBase,
  verifyBase,
  buildSignatureInputHeader,
  buildSignatureHeader,
  extractSignatureFromHeader,
  parseSignatureInputHeader,
} = require("../../src/features/pawapay/utils/signature.util");
const {
  computeContentDigest,
  verifyContentDigest,
} = require("../../src/features/pawapay/utils/content-digest.util");

describe("PawaPay RFC-9421 signature implementation", () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "prime256v1",
  });

  test("content digest matches for identical body, fails for tampered body", () => {
    const body = JSON.stringify({ depositId: "abc-123", amount: "15" });
    const digest = computeContentDigest(body);
    expect(digest.startsWith("sha-512=:")).toBe(true);
    expect(verifyContentDigest(body, digest)).toBe(true);

    const tampered = JSON.stringify({ depositId: "abc-123", amount: "150" });
    expect(verifyContentDigest(tampered, digest)).toBe(false);
  });

  test("signature is IEEE P1363 format (64 bytes), not DER", () => {
    const base = buildRequestSignatureBase({
      method: "POST",
      authority: "api.sandbox.pawapay.io",
      path: "/v2/deposits",
      signatureDate: "2026-07-11T10:00:00.000000Z",
      contentDigest: "sha-512=:abc123:",
      contentType: "application/json; charset=UTF-8",
      created: 1700000000,
      expires: 1700000060,
      keyId: "test-key",
      alg: "ecdsa-p256-sha256",
    });
    const sigBase64 = signBase(base, privateKey);
    expect(Buffer.from(sigBase64, "base64").length).toBe(64);
  });

  test("signature round-trips: sign then verify succeeds with correct key", () => {
    const base = buildRequestSignatureBase({
      method: "POST",
      authority: "api.sandbox.pawapay.io",
      path: "/v2/deposits",
      signatureDate: "2026-07-11T10:00:00.000000Z",
      contentDigest: "sha-512=:abc123:",
      contentType: "application/json; charset=UTF-8",
      created: 1700000000,
      expires: 1700000060,
      keyId: "test-key",
      alg: "ecdsa-p256-sha256",
    });
    const sigBase64 = signBase(base, privateKey);
    expect(verifyBase(base, sigBase64, publicKey)).toBe(true);
  });

  test("signature verification fails with wrong public key", () => {
    const { publicKey: wrongKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
    });
    const base = buildRequestSignatureBase({
      method: "POST",
      authority: "api.sandbox.pawapay.io",
      path: "/v2/deposits",
      signatureDate: "x",
      contentDigest: "sha-512=:abc:",
      contentType: "application/json",
      created: 1,
      expires: 60,
      keyId: "k",
      alg: "ecdsa-p256-sha256",
    });
    const sig = signBase(base, privateKey);
    expect(verifyBase(base, sig, wrongKey)).toBe(false);
  });

  test("signature verification fails if base is tampered after signing", () => {
    const base = buildRequestSignatureBase({
      method: "POST",
      authority: "api.sandbox.pawapay.io",
      path: "/v2/deposits",
      signatureDate: "x",
      contentDigest: "sha-512=:abc:",
      contentType: "application/json",
      created: 1,
      expires: 60,
      keyId: "k",
      alg: "ecdsa-p256-sha256",
    });
    const sig = signBase(base, privateKey);
    const tamperedBase = base.replace("/v2/deposits", "/v2/payouts");
    expect(verifyBase(tamperedBase, sig, publicKey)).toBe(false);
  });

  test("Signature-Input header round-trips through parse", () => {
    const header = buildSignatureInputHeader({
      created: 1700000000,
      expires: 1700000060,
      keyId: "test-key",
      alg: "ecdsa-p256-sha256",
    });
    const parsed = parseSignatureInputHeader(header);
    expect(parsed.components).toEqual([
      "@method",
      "@authority",
      "@path",
      "signature-date",
      "content-digest",
      "content-type",
    ]);
    expect(parsed.alg).toBe("ecdsa-p256-sha256");
    expect(parsed.keyid).toBe("test-key");
  });

  test("Signature header round-trips through extract", () => {
    const sig =
      "MEQCIHoWKI71ADMmqwtwW48CHgfbDWdVItVMNlXTFJjoxmEDAiBTY30Le4wQd3RXqvmYubVwrxuP7Tz1SeZcnsNdHqjJDg==";
    expect(extractSignatureFromHeader(buildSignatureHeader(sig))).toBe(sig);
  });
});
