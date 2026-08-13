const crypto = require("crypto");
const { httpbis } = require("http-message-signatures");
const {
  getPrivateKeyPem,
  getPublicKeyPem,
  getKeyId,
  getBaseUrl,
} = require("../config/pawapay.config");

function computeContentDigest(bodyString) {
  const hash = crypto.createHash("sha512").update(bodyString).digest("base64");
  return `sha-512=:${hash}:`;
}

function ppSigner(privateKey, algorithm, id) {
  return {
    id,
    alg: algorithm,
    async sign(data) {
      return crypto.createSign("SHA256").update(data).sign(privateKey);
    },
  };
}

async function signFinancialRequest({ method, path, bodyString }) {
  const privateKeyPemRaw = getPrivateKeyPem();
  const keyId = getKeyId();

  if (!privateKeyPemRaw || !keyId) {
    throw new Error(
      "[pawapay] Cannot sign request: private key or keyId is missing from config.",
    );
  }

  const privateKey = crypto.createPrivateKey(privateKeyPemRaw);
  const contentDigest = computeContentDigest(bodyString);
  const signatureDate = new Date().toISOString();
  const fullUrl = `${getBaseUrl()}${path}`;

  const signedRequest = await httpbis.signMessage(
    {
      key: ppSigner(privateKey, "ecdsa-p256-sha256", keyId),
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
      method,
      url: fullUrl,
      headers: {
        "Signature-Date": signatureDate,
        "Content-Type": "application/json",
        "Content-Digest": contentDigest,
        "Content-Length": Buffer.byteLength(bodyString).toString(),
      },
      body: bodyString,
    },
  );

  return signedRequest.headers;
}

function verifyContentDigest(headerValue, bodyBuffer) {
  if (!headerValue) return false;
  const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  const match = /^(sha-256|sha-512)=:([^:]+):$/.exec(raw.trim());
  if (!match) return false;

  const [, algo, base64Digest] = match;
  const nodeAlgo = algo === "sha-256" ? "sha256" : "sha512";
  const expected = crypto.createHash(nodeAlgo).update(bodyBuffer).digest();

  let actual;
  try {
    actual = Buffer.from(base64Digest, "base64");
  } catch {
    return false;
  }

  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

async function verifyInboundSignature({ method, url, headers, bodyBuffer }) {
  const publicKeyPem = getPublicKeyPem();
  const configuredKeyId = getKeyId();

  if (!publicKeyPem) {
    console.error(
      "[pawapay] Cannot verify webhook signature: no public key configured for this environment.",
    );
    return false;
  }

  const contentDigestHeader = headers["content-digest"];
  if (!verifyContentDigest(contentDigestHeader, bodyBuffer || Buffer.alloc(0))) {
    return false;
  }

  let publicKey;
  try {
    publicKey = crypto.createPublicKey(publicKeyPem);
  } catch (err) {
    console.error("[pawapay] Configured public key is not valid PEM:", err.message);
    return false;
  }

  try {
    const result = await httpbis.verifyMessage(
      {
        keyLookup: async (params) => {
          if (
            configuredKeyId &&
            params.keyid &&
            params.keyid !== configuredKeyId
          ) {
            return null;
          }
          return {
            id: configuredKeyId,
            algs: ["ecdsa-p256-sha256"],
            verify: async (data, signature) => {
              try {
                return crypto
                  .createVerify("SHA256")
                  .update(data)
                  .verify(publicKey, signature);
              } catch {
                return false;
              }
            },
          };
        },
        requiredFields: ["@method", "@path", "content-digest"],
        tolerance: 5 * 60,
      },
      { method, url, headers },
    );
    return result === true;
  } catch (err) {
    console.error(
      "[pawapay] Webhook signature verification error:",
      err.message,
    );
    return false;
  }
}

module.exports = {
  computeContentDigest,
  signFinancialRequest,
  verifyInboundSignature,
};
