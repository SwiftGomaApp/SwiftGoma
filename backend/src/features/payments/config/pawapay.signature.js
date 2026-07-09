const crypto = require("crypto");
const {
  pawapay_environement,
  pawapay_signed_requests,
  pawapay_signed_callbacks,
  pawapay_sign_algorithm,
  pawapay_signature_validity_seconds,
  pawapay_key_id_production,
  pawapay_private_key_pem_base64_production,
  pawapay_key_id_sandbox,
  pawapay_private_key_pem_base64_sandbox,
} = require("../../../config/env.config");

const isProduction = pawapay_environement === "production";

const KEY_ID = isProduction
  ? pawapay_key_id_production
  : pawapay_key_id_sandbox;

const PRIVATE_KEY_PEM_BASE64 = isProduction
  ? pawapay_private_key_pem_base64_production
  : pawapay_private_key_pem_base64_sandbox;

const SIGN_ALGORITHM = pawapay_sign_algorithm || "ecdsa-p256-sha256";
const VALIDITY_SECONDS = parseInt(
  pawapay_signature_validity_seconds || "60",
  10,
);

const PRIVATE_KEY_PEM = PRIVATE_KEY_PEM_BASE64
  ? Buffer.from(PRIVATE_KEY_PEM_BASE64, "base64").toString("utf8")
  : null;

const ALG_TO_NODE_CURVE = {
  "ecdsa-p256-sha256": { hash: "sha256", curve: "P-256" },
  "ecdsa-p384-sha384": { hash: "sha384", curve: "P-384" },
};

const isSignedRequestsEnabled = pawapay_signed_requests === "true";
const isSignedCallbacksEnabled = pawapay_signed_callbacks === "true";

if (isSignedRequestsEnabled) {
  if (!PRIVATE_KEY_PEM) {
    throw new Error(
      `PAWAPAY_SIGNED_REQUESTS is true but no private key is configured for the "${
        isProduction ? "production" : "sandbox"
      }" environment. Check PAWAPAY_PRIVATE_KEY_PEM_BASE64${isProduction ? "" : "_SANDBOX"}.`,
    );
  }
  if (!KEY_ID) {
    throw new Error(
      `PAWAPAY_SIGNED_REQUESTS is true but no Key ID is configured for the "${
        isProduction ? "production" : "sandbox"
      }" environment. Check PAWAPAY_KEY_ID${isProduction ? "" : "_SANDBOX"}.`,
    );
  }
}

const buildContentDigest = (body) => {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const hash = crypto.createHash("sha512").update(raw, "utf8").digest("base64");
  return `sha-512=${hash}`;
};

const buildSignatureBase = ({
  method,
  authority,
  path,
  signatureDate,
  contentDigest,
  contentType,
  created,
  expires,
}) => {
  const params = `("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${SIGN_ALGORITHM}";keyid="${KEY_ID}";created=${created};expires=${expires}`;

  return [
    `"@method": ${method.toUpperCase()}`,
    `"@authority": ${authority}`,
    `"@path": ${path}`,
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigest}`,
    `"content-type": ${contentType}`,
    `"@signature-params": ${params}`,
  ].join("\n");
};

const sign = (signatureBase) => {
  if (!PRIVATE_KEY_PEM) {
    throw new Error(
      `No pawaPay private key configured for the "${
        isProduction ? "production" : "sandbox"
      }" environment — cannot sign request.`,
    );
  }

  const { hash } =
    ALG_TO_NODE_CURVE[SIGN_ALGORITHM] || ALG_TO_NODE_CURVE["ecdsa-p256-sha256"];

  const signature = crypto.sign(hash, Buffer.from(signatureBase, "utf8"), {
    key: PRIVATE_KEY_PEM,
    dsaEncoding: "ieee-p1363",
  });

  return signature.toString("base64");
};

const buildSignedHeaders = ({ method, authority, path, body }) => {
  const now = new Date();
  const signatureDate = now.toISOString();
  const created = Math.floor(now.getTime() / 1000);
  const expires = created + VALIDITY_SECONDS;
  const contentType = "application/json; charset=UTF-8";

  const contentDigest = buildContentDigest(body);

  const signatureBase = buildSignatureBase({
    method,
    authority,
    path,
    signatureDate,
    contentDigest,
    contentType,
    created,
    expires,
  });

  const signature = sign(signatureBase);

  return {
    "Content-Type": contentType,
    "Content-Digest": contentDigest,
    "Signature-Date": signatureDate,
    Signature: `sig-pp=:${signature}:`,
    "Signature-Input": `sig-pp=("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${SIGN_ALGORITHM}";keyid="${KEY_ID}";created=${created};expires=${expires}`,
  };
};

const verifyCallbackSignature = ({
  method,
  authority,
  path,
  headers,
  rawBody,
  publicKeyPem,
}) => {
  const signatureInput = headers["signature-input"];
  const signatureHeader = headers["signature"];
  const signatureDate = headers["signature-date"];
  const contentDigestHeader = headers["content-digest"];
  const contentType = headers["content-type"];

  if (
    !signatureInput ||
    !signatureHeader ||
    !signatureDate ||
    !contentDigestHeader
  ) {
    return { valid: false, reason: "Missing signature headers" };
  }

  const expectedDigest = buildContentDigest(rawBody);
  if (expectedDigest !== contentDigestHeader) {
    return { valid: false, reason: "Content-Digest mismatch" };
  }

  const match = signatureInput.match(
    /sig-pp=\(([^)]+)\);alg="([^"]+)";keyid="([^"]+)";created=(\d+);expires=(\d+)/,
  );
  if (!match) {
    return { valid: false, reason: "Unable to parse Signature-Input" };
  }
  const [, componentsRaw, alg, keyid, created, expires] = match;

  const now = Math.floor(Date.now() / 1000);
  if (now > parseInt(expires, 10)) {
    return { valid: false, reason: "Signature expired" };
  }

  const components = componentsRaw.split(" ").map((c) => c.replace(/"/g, ""));

  const values = {
    "@method": method.toUpperCase(),
    "@authority": authority,
    "@path": path,
    "signature-date": signatureDate,
    "content-digest": contentDigestHeader,
    "content-type": contentType,
  };

  const lines = components.map((c) => `"${c}": ${values[c]}`);
  lines.push(
    `"@signature-params": (${componentsRaw});alg="${alg}";keyid="${keyid}";created=${created};expires=${expires}`,
  );
  const signatureBase = lines.join("\n");

  const sigMatch = signatureHeader.match(/sig-pp=:([^:]+):/);
  if (!sigMatch) {
    return { valid: false, reason: "Unable to parse Signature header" };
  }
  const signatureBytes = Buffer.from(sigMatch[1], "base64");

  const { hash } =
    ALG_TO_NODE_CURVE[alg] || ALG_TO_NODE_CURVE["ecdsa-p256-sha256"];

  const isValid = crypto.verify(
    hash,
    Buffer.from(signatureBase, "utf8"),
    { key: publicKeyPem, dsaEncoding: "ieee-p1363" },
    signatureBytes,
  );

  return {
    valid: isValid,
    reason: isValid ? null : "Signature verification failed",
  };
};

module.exports = {
  environment: isProduction ? "production" : "sandbox",
  isSignedRequestsEnabled,
  isSignedCallbacksEnabled,
  buildSignedHeaders,
  buildContentDigest,
  verifyCallbackSignature,
};
