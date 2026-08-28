const appleSigninAuth = require("apple-signin-auth");

const { env } = require("../../../config/env");
const { UnauthorizedError } = require("../../../common/errors");

async function verifyAppleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new UnauthorizedError("Jeton Apple ID manquant.");
  }

  let payload;
  try {
    payload = await appleSigninAuth.verifyIdToken(idToken, {
      audience: env.apple.clientIds,
      ignoreExpiration: false,
    });
  } catch (err) {
    throw new UnauthorizedError(
      "Connexion Apple invalide ou expirée. Veuillez réessayer.",
    );
  }

  if (!payload || !payload.sub) {
    throw new UnauthorizedError("Reponse de connexion Apple invalide.");
  }

  return {
    appleId: payload.sub,
    email: payload.email || null,
    emailVerified:
      payload.email_verified === true || payload.email_verified === "true",
    isPrimary:
      payload.is_private_email === true || payload.is_private_email === "true",
  };
}

module.exports = { verifyAppleIdToken };
