"use strict";

const crypto = require("crypto");
const axios = require("axios");
const config = require("../../../config/pawapay.config");
const { AppError } = require("../../../shared/errors/app.error");

function rawBodySaver(req, res, buf) {
  req.rawBody = buf;
}

const KEY_CACHE_TTL_MS = 60 * 60 * 1000;
let keyCache = { fetchedAt: 0, keysById: new Map() };

async function fetchPublicKeys() {
  const res = await axios.get(`${config.baseURL}/public-key/http`, {
    headers: { Authorization: `Bearer ${config.apiToken}` },
    timeout: config.requestTimeoutMs,
  });

  const keysById = new Map();
  for (const entry of res.data || []) {
    keysById.set(entry.id, entry.key);
  }
  return keysById;
}

async function getPublicKey(keyId) {
  const isStale = Date.now() - keyCache.fetchedAt > KEY_CACHE_TTL_MS;

  if (isStale || !keyCache.keysById.has(keyId)) {
    keyCache = { fetchedAt: Date.now(), keysById: await fetchPublicKeys() };
  }

  const key = keyCache.keysById.get(keyId);
  if (!key) {
    throw new AppError(
      `Clé publique pawaPay introuvable pour keyid "${keyId}".`,
      401,
      "UNKNOWN_SIGNING_KEY",
    );
  }
  return key;
}

function parseSignatureInput(headerValue) {
  const eqIdx = headerValue.indexOf("=");
  if (eqIdx === -1) {
    throw new AppError(
      "En-tête Signature-Input malformé.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  const label = headerValue.slice(0, eqIdx).trim();
  const rest = headerValue.slice(eqIdx + 1).trim();

  const componentsMatch = rest.match(/^\(([^)]*)\)/);
  if (!componentsMatch) {
    throw new AppError(
      "En-tête Signature-Input malformé.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  const components = componentsMatch[1]
    .split(" ")
    .map((c) => c.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);

  const params = {};
  const paramsRaw = rest.slice(componentsMatch[0].length);
  for (const part of paramsRaw
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params[part.slice(0, eq)] = part.slice(eq + 1).replace(/^"|"$/g, "");
  }

  return { label, components, params, signatureParamsValue: rest };
}

function parseSignatureHeader(headerValue, label) {
  const re = new RegExp(`(?:^|,)\\s*${label}=:([^:]+):`);
  const match = headerValue.match(re);
  if (!match) {
    throw new AppError(
      `Aucune signature trouvée pour le label "${label}".`,
      401,
      "INVALID_SIGNATURE",
    );
  }
  return Buffer.from(match[1], "base64");
}

function verifyContentDigest(contentDigestHeader, rawBody) {
  const match = contentDigestHeader.match(/^(sha-256|sha-512)=:(.+):$/);
  if (!match) {
    throw new AppError(
      "En-tête Content-Digest malformé.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  const [, algLabel, expectedB64] = match;
  const nodeAlg = algLabel === "sha-256" ? "sha256" : "sha512";
  const actualB64 = crypto.createHash(nodeAlg).update(rawBody).digest("base64");

  const expected = Buffer.from(expectedB64, "base64");
  const actual = Buffer.from(actualB64, "base64");

  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    throw new AppError(
      "Le corps de la requête ne correspond pas au Content-Digest.",
      401,
      "INVALID_SIGNATURE",
    );
  }
}

function verifyWithAlgorithm(alg, data, signature, publicKeyPem) {
  switch (alg) {
    case "ecdsa-p256-sha256":
      return crypto.verify(
        "sha256",
        data,
        { key: publicKeyPem, dsaEncoding: "der" },
        signature,
      );
    case "ecdsa-p384-sha384":
      return crypto.verify(
        "sha384",
        data,
        { key: publicKeyPem, dsaEncoding: "der" },
        signature,
      );
    case "rsa-pss-sha512":
      return crypto.verify(
        "sha512",
        data,
        {
          key: publicKeyPem,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
        },
        signature,
      );
    case "rsa-v1_5-sha256":
      return crypto.verify(
        "sha256",
        data,
        { key: publicKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING },
        signature,
      );
    default:
      throw new AppError(
        `Algorithme de signature non supporté: ${alg}`,
        401,
        "UNSUPPORTED_ALG",
      );
  }
}

const COMPONENT_RESOLVERS = {
  "@method": (req) => req.method.toUpperCase(),
  "@authority": (req) => req.headers.host,
  "@path": (req) => req.originalUrl.split("?")[0],
  "signature-date": (req) => req.headers["signature-date"],
  "content-digest": (req) => req.headers["content-digest"],
  "content-type": (req) => req.headers["content-type"],
};

/**
 * Verifies a pawaPay callback request end-to-end.
 * Throws an AppError(401) if anything doesn't check out.
 * Resolves silently if the signature is valid.
 */
async function verifyPawapayCallback(req) {
  const sigInputHeader = req.headers["signature-input"];
  const sigHeader = req.headers["signature"];
  const contentDigestHeader = req.headers["content-digest"];

  if (!sigInputHeader || !sigHeader || !contentDigestHeader) {
    throw new AppError(
      "En-têtes de signature manquants sur le callback pawaPay.",
      401,
      "MISSING_SIGNATURE",
    );
  }

  if (!req.rawBody) {
    throw new AppError(
      "req.rawBody est introuvable — vérifiez que express.json({ verify: rawBodySaver }) est bien configuré.",
      500,
      "RAW_BODY_MISSING",
    );
  }

  verifyContentDigest(contentDigestHeader, req.rawBody);

  const { label, components, params, signatureParamsValue } =
    parseSignatureInput(sigInputHeader);
  const signatureBytes = parseSignatureHeader(sigHeader, label);

  if (params.expires && Number(params.expires) * 1000 < Date.now()) {
    throw new AppError(
      "La signature du callback a expiré.",
      401,
      "SIGNATURE_EXPIRED",
    );
  }
  if (!params.keyid || !params.alg) {
    throw new AppError(
      "Paramètres de signature incomplets.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  const lines = components.map((component) => {
    const resolve = COMPONENT_RESOLVERS[component];
    if (!resolve) {
      throw new AppError(
        `Composant de signature non pris en charge: ${component}`,
        401,
        "INVALID_SIGNATURE",
      );
    }
    return `"${component}": ${resolve(req)}`;
  });
  lines.push(`"@signature-params": ${signatureParamsValue}`);
  const signatureBase = Buffer.from(lines.join("\n"), "utf8");

  const publicKeyPem = await getPublicKey(params.keyid);
  const isValid = verifyWithAlgorithm(
    params.alg,
    signatureBase,
    signatureBytes,
    publicKeyPem,
  );

  if (!isValid) {
    throw new AppError("Signature pawaPay invalide.", 401, "INVALID_SIGNATURE");
  }
}

module.exports = {
  rawBodySaver,
  verifyPawapayCallback,
};
