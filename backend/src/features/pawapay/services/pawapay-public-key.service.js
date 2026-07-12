const { pawapayRequest } = require("../utils/pawapay.client");

let cache = { keys: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; 

const fetchPublicKeys = async () => {
  const now = Date.now();
  if (cache.keys && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.keys;
  }

  const keys = await pawapayRequest("GET", "/public-key/http", null);
  cache = { keys, fetchedAt: now };
  return keys;
};


const getPublicKeyById = async (keyId) => {
  const keys = await fetchPublicKeys();
  const match = keys.find((k) => k.id === keyId);
  return match ? match.key : null;
};

const clearCache = () => {
  cache = { keys: null, fetchedAt: 0 };
};

module.exports = { getPublicKeyById, clearCache };
