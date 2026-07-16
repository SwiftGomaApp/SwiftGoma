const { env } = require("../../../config/env");
const { BRAND } = require("../../../common/constants/brand");

const WEBAUTHN_CONFIG = {
  rpID: env.webauthn.rpId,
  rpName: env.webauthn.rpName || BRAND.name,
  expectedOrigins: env.clientOrigins,
  timeoutMs: 60_000,
  residentKey: "preferred",
  userVerification: "preferred",
  authenticatorAttachment: undefined,
};

module.exports = { WEBAUTHN_CONFIG };
