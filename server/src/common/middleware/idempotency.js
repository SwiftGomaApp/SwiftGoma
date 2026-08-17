const crypto = require("crypto");
const { getRedisClient } = require("../../config/redis");
const { ConflictError } = require("../errors");

const PROCESSING_MARKER = "__PROCESSING__";

const memoryStore = new Map();

function readMemory(key) {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function writeMemory(key, value, ttlSeconds) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function deleteMemory(key) {
  memoryStore.delete(key);
}

function computeIdempotencyKey(req, scope) {
  const provided = req.headers["idempotency-key"];
  const userPart = req.user?.id || "anon";

  if (typeof provided === "string" && provided.trim()) {
    return `idem:${scope}:${userPart}:${provided.trim()}`;
  }

  const bodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(req.body || {}))
    .digest("hex");
  return `idem:${scope}:${userPart}:auto:${bodyHash}`;
}

function idempotencyGuard({
  scope,
  lockTtlSeconds = 120,
  successTtlSeconds = 24 * 60 * 60,
}) {
  if (!scope) {
    throw new Error(
      "idempotencyGuard : `scope` est requis (utilisé pour namespacer les clés).",
    );
  }

  return async function idempotencyMiddleware(req, res, next) {
    const key = computeIdempotencyKey(req, scope);
    const redis = getRedisClient();

    try {
      if (redis) {
        const acquired = await redis.set(
          key,
          PROCESSING_MARKER,
          "EX",
          lockTtlSeconds,
          "NX",
        );

        if (!acquired) {
          const existing = await redis.get(key);

          if (existing === PROCESSING_MARKER) {
            throw new ConflictError(
              "Une requête identique est déjà en cours de traitement. Veuillez patienter.",
            );
          }

          if (existing) {
            const cached = JSON.parse(existing);
            return res.status(cached.statusCode).json(cached.body);
          }
          await redis.set(key, PROCESSING_MARKER, "EX", lockTtlSeconds, "NX");
        }
      } else {
        const existing = readMemory(key);

        if (existing === PROCESSING_MARKER) {
          throw new ConflictError(
            "Une requête identique est déjà en cours de traitement. Veuillez patienter.",
          );
        }

        if (existing) {
          const cached = JSON.parse(existing);
          return res.status(cached.statusCode).json(cached.body);
        }

        writeMemory(key, PROCESSING_MARKER, lockTtlSeconds);
      }
    } catch (err) {
      if (err instanceof ConflictError) throw err;
      console.error(
        "[idempotency] échec de l'acquisition du verrou, passage sans protection:",
        err.message,
      );
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.locals.__idempotencyBody = body;
      return originalJson(body);
    };

    res.on("finish", () => {
      const body = res.locals.__idempotencyBody;

      (async () => {
        try {
          const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

          if (isSuccess && body !== undefined) {
            const serialized = JSON.stringify({
              statusCode: res.statusCode,
              body,
            });
            if (redis) {
              await redis.set(key, serialized, "EX", successTtlSeconds);
            } else {
              writeMemory(key, serialized, successTtlSeconds);
            }
          } else {
            if (redis) {
              await redis.del(key);
            } else {
              deleteMemory(key);
            }
          }
        } catch (err) {
          console.error(
            "[idempotency] échec de la persistance de la réponse:",
            err.message,
          );
        }
      })();
    });

    next();
  };
}

module.exports = { idempotencyGuard };
