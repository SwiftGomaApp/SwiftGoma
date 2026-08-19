const { getRedisClient } = require("../../../config/redis");
const { TOTP_CONFIG } = require("../config/totp.config");

const PREFIX = "totp:used:";

const CLAIM_TTL_SECONDS =
  TOTP_CONFIG.period * (TOTP_CONFIG.verificationWindow + 2);

async function claimTotpStep(userId, step) {
  const client = getRedisClient();
  if (!client) {
    console.error(
      "[totp] Redis unvailable - rejecting TOTP verification (fail closed).",
    );
    return false;
  }

  const key = `${PREFIX}${userId}:${step}`;
  const result = await client.set(key, "1", "EX", CLAIM_TTL_SECONDS, "NX");

  return result === "OK";
}

module.exports = { claimTotpStep };
