const { pawapayClient, environment } = require("../config/pawapay.config");

let cache = {
  keys: null,
  fetchedAt: 0,
};

const CACHE_TTL_MS = 60 * 60 * 1000;

const getPawapayPublicKeys = async ({ forceRefresh = false } = {}) => {
  const isExpired = Date.now() - cache.fetchedAt > CACHE_TTL_MS;

  if (!forceRefresh && cache.keys && !isExpired) {
    return cache.keys;
  }

  const { data } = await pawapayClient.get("/public-key/http");
  cache = { keys: data, fetchedAt: Date.now() };
  return data;
};

const getPublicKeyById = async (keyId) => {
  let keys = await getPawapayPublicKeys();
  let match = keys.find((k) => k.id === keyId);

  if (!match) {
    keys = await getPawapayPublicKeys({ forceRefresh: true });
    match = keys.find((k) => k.id === keyId);
  }

  if (!match) {
    throw new Error(
      `pawaPay public key "${keyId}" not found (environment: ${environment}).`,
    );
  }

  return match.key;
};

module.exports = { getPawapayPublicKeys, getPublicKeyById };
