const crypto = require("crypto");

const computeContentDigest = (rawBody) => {
  const hash = crypto
    .createHash("sha512")
    .update(rawBody, "utf8")
    .digest("base64");
  return `sha-512=:${hash}:`;
};

const verifyContentDigest = (rawBody, contentDigestHeader) => {
  const match = /^sha-(256|512)=:(.+):$/.exec(contentDigestHeader || "");
  if (!match) return false;

  const [, bits, expectedBase64] = match;
  const algo = bits === "256" ? "sha256" : "sha512";
  const actualBase64 = crypto
    .createHash(algo)
    .update(rawBody, "utf8")
    .digest("base64");

  const a = Buffer.from(expectedBase64, "base64");
  const b = Buffer.from(actualBase64, "base64");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

module.exports = { computeContentDigest, verifyContentDigest };
