const crypto = require("crypto");
const { pawapayConfig } = require("../config/pawapay.config");
const { errors } = require("../../../shared/errors/app.error");
const { verifyContentDigest } = require("../utils/content-digest.util");
const {
  buildCallbackSignatureBase,
  verifyBase,
  extractSignatureFromHeader,
  parseSignatureInputHeader,
} = require("../utils/signature.util");
const { getPublicKeyById } = require("../services/pawapay-public-key.service");

const verifyCallbackSignature = async (req, res, next) => {
  if (!pawapayConfig.signedCallbacks) {
    console.warn(
      "PawaPay callback signature verification is DISABLED (PAWAPAY_SIGNED_CALLBACKS=false). " +
        "Anyone who discovers this URL can forge payment confirmations. Do not run this in production.",
    );
    return next();
  }

  try {
    if (!req.rawBody) {
      throw errors.badRequest(
        "Callback raw body not available — check that rawBodyParser is mounted before this middleware.",
      );
    }

    const contentDigestHeader = req.headers["content-digest"];
    const signatureHeader = req.headers["signature"];
    const signatureInputHeader = req.headers["signature-input"];
    const signatureDateHeader = req.headers["signature-date"];

    if (
      !contentDigestHeader ||
      !signatureHeader ||
      !signatureInputHeader ||
      !signatureDateHeader
    ) {
      throw errors.unauthorized();
    }

    if (!verifyContentDigest(req.rawBody, contentDigestHeader)) {
      throw errors.unauthorized();
    }

    const parsedInput = parseSignatureInputHeader(signatureInputHeader);
    if (!parsedInput) {
      throw errors.unauthorized();
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Number(parsedInput.expires) < nowSeconds) {
      throw errors.unauthorized();
    }

    const authority = req.headers.host;
    const path = req.originalUrl;

    const base = buildCallbackSignatureBase({
      method: req.method,
      authority,
      path,
      signatureDate: signatureDateHeader,
      contentDigest: contentDigestHeader,
      contentType: req.headers["content-type"],
      created: parsedInput.created,
      expires: parsedInput.expires,
      keyId: parsedInput.keyid,
      alg: parsedInput.alg,
    });

    const publicKeyPem = await getPublicKeyById(parsedInput.keyid);
    if (!publicKeyPem) {
      throw errors.unauthorized();
    }

    const publicKey = crypto.createPublicKey(publicKeyPem);
    const signatureBase64 = extractSignatureFromHeader(signatureHeader);
    const isValid = verifyBase(base, signatureBase64, publicKey);

    if (!isValid) {
      throw errors.unauthorized();
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { verifyCallbackSignature };
