const crypto = require("crypto");

const buildRequestSignatureBase = ({
  method,
  authority,
  path,
  signatureDate,
  contentDigest,
  contentType,
  created,
  expires,
  keyId,
  alg,
}) => {
  const lines = [
    `"@method": ${method.toUpperCase()}`,
    `"@authority": ${authority}`,
    `"@path": ${path}`,
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigest}`,
    `"content-type": ${contentType}`,
    `"@signature-params": ("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${alg}";keyid="${keyId}";created=${created};expires=${expires}`,
  ];
  return lines.join("\n");
};

const buildCallbackSignatureBase = ({
  method,
  authority,
  path,
  signatureDate,
  contentDigest,
  contentType,
  created,
  expires,
  keyId,
  alg,
}) => {
  const lines = [
    `"@method": ${method.toUpperCase()}`,
    `"@authority": ${authority}`,
    `"@path": ${path}`,
    `"signature-date": ${signatureDate}`,
    `"content-digest": ${contentDigest}`,
    `"content-type": ${contentType}`,
    `"@signature-params": ("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${alg}";keyid="${keyId}";created=${created};expires=${expires}`,
  ];
  return lines.join("\n");
};

const signBase = (base, privateKey) => {
  const signature = crypto.sign("sha256", Buffer.from(base, "utf8"), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });
  return signature.toString("base64");
};

const verifyBase = (base, signatureBase64, publicKey) => {
  const signature = Buffer.from(signatureBase64, "base64");
  return crypto.verify(
    "sha256",
    Buffer.from(base, "utf8"),
    {
      key: publicKey,
      dsaEncoding: "ieee-p1363",
    },
    signature,
  );
};

const buildSignatureInputHeader = ({ created, expires, keyId, alg }) => {
  return `sig-pp=("@method" "@authority" "@path" "signature-date" "content-digest" "content-type");alg="${alg}";keyid="${keyId}";created=${created};expires=${expires}`;
};

const buildSignatureHeader = (signatureBase64) => {
  return `sig-pp=:${signatureBase64}:`;
};

const extractSignatureFromHeader = (signatureHeader) => {
  const match = /sig-pp=:(.+):/.exec(signatureHeader || "");
  return match ? match[1] : null;
};

const parseSignatureInputHeader = (signatureInputHeader) => {
  const match = /sig-pp=\(([^)]*)\);(.+)/.exec(signatureInputHeader || "");
  if (!match) return null;

  const [, componentsRaw, paramsRaw] = match;
  const components = componentsRaw
    .split(" ")
    .map((c) => c.replace(/"/g, ""))
    .filter(Boolean);

  const params = {};
  paramsRaw.split(";").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (!key) return;
    params[key] = value ? value.replace(/^"|"$/g, "") : value;
  });

  return { components, ...params };
};

module.exports = {
  buildRequestSignatureBase,
  buildCallbackSignatureBase,
  signBase,
  verifyBase,
  buildSignatureInputHeader,
  buildSignatureHeader,
  extractSignatureFromHeader,
  parseSignatureInputHeader,
};
