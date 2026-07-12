const axios = require("axios");
const { pawapayConfig } = require("../config/pawapay.config");
const { AppError } = require("../../../shared/errors/app.error");
const { computeContentDigest } = require("../utils/content-digest.util");
const {
  buildRequestSignatureBase,
  signBase,
  buildSignatureHeader,
  buildSignatureInputHeader,
} = require("../utils/signature.util");

const buildSignatureDate = () => {
  return new Date().toISOString().replace("Z", "000Z");
};

const buildSignedHeaders = ({ method, path, rawBody, contentType }) => {
  const authority = new URL(pawapayConfig.baseUrl).host;
  const contentDigest = computeContentDigest(rawBody);
  const signatureDate = buildSignatureDate();
  const created = Math.floor(Date.now() / 1000);
  const expires = created + pawapayConfig.signatureValiditySeconds;

  const base = buildRequestSignatureBase({
    method,
    authority,
    path,
    signatureDate,
    contentDigest,
    contentType,
    created,
    expires,
    keyId: pawapayConfig.keyId,
    alg: pawapayConfig.signAlgorithm,
  });

  const signatureBase64 = signBase(base, pawapayConfig.privateKey);

  return {
    "Content-Digest": contentDigest,
    "Signature-Date": signatureDate,
    Signature: buildSignatureHeader(signatureBase64),
    "Signature-Input": buildSignatureInputHeader({
      created,
      expires,
      keyId: pawapayConfig.keyId,
      alg: pawapayConfig.signAlgorithm,
    }),
  };
};

const pawapayRequest = async (method, path, body = null) => {
  const contentType = "application/json; charset=UTF-8";
  const rawBody = body ? JSON.stringify(body) : "";

  const headers = {
    Authorization: `Bearer ${pawapayConfig.apiToken}`,
    "Content-Type": contentType,
    Accept: "application/json",
  };

  if (pawapayConfig.signedRequests && body !== null) {
    Object.assign(
      headers,
      buildSignedHeaders({ method, path, rawBody, contentType }),
    );
  }

  try {
    const response = await axios({
      method,
      url: `${pawapayConfig.baseUrl}${path}`,
      headers,
      data: body,
      timeout: 15000,
    });
    return response.data;
  } catch (err) {
    if (err.response) {
      const pawapayMessage =
        err.response.data?.errorMessage ||
        err.response.data?.message ||
        JSON.stringify(err.response.data);

      throw new AppError(
        `PawaPay ${method} ${path} failed (${err.response.status}): ${pawapayMessage}`,
        502,
        "PAWAPAY_REQUEST_FAILED",
      );
    }

    throw new AppError(
      `PawaPay ${method} ${path} unreachable: ${err.message}`,
      503,
      "PAWAPAY_UNREACHABLE",
    );
  }
};

module.exports = { pawapayRequest };
