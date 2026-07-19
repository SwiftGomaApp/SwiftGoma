const crypto = require("crypto");
const { httpbis } = require("http-message-signatures");
const {
  getPrivateKeyPem,
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

module.exports = { computeContentDigest, signFinancialRequest };
