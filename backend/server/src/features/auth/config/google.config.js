const { OAuth2Client } = require("google-auth-library");

const { env } = require("../../../config/env");
const { UnauthorizedError } = require("../../../common/errors");

let client = null;

function getGoogleClient() {
  if (!client) {
    client = new OAuth2Client(env.google.clientId);
  }
  return client;
}

async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new UnauthorizedError("Missing Google ID token.");
  }

  let ticket;
  try {
    ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: env.google.clientId,
    });
  } catch (err) {
    throw new UnauthorizedError(
      "Invalid or expired Google sign-in. Please try again.",
    );
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new UnauthorizedError("Invalid Google sign-in response.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture || null,
  };
}

module.exports = { getGoogleClient, verifyGoogleIdToken };
