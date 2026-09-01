const express = require("express");

// For webhook endpoints whose signature is verified over the exact raw
// request bytes: express.json() only captures req.rawBody when the
// incoming Content-Type matches what it expects to parse. If a webhook
// sender omits or varies that header, express.json() silently skips the
// body entirely, req.rawBody never gets set, and any fallback to
// Buffer.from(JSON.stringify(req.body)) computes a digest over the wrong
// bytes — signature verification then fails for every such request. This
// middleware captures the raw body unconditionally, regardless of
// Content-Type, so verification always runs against what was actually sent.
function rawBodyJson({ limit = "2mb" } = {}) {
  const raw = express.raw({ type: () => true, limit });

  return (req, res, next) => {
    raw(req, res, (err) => {
      if (err) return next(err);

      const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      req.rawBody = buf;

      if (buf.length === 0) {
        req.body = {};
        return next();
      }

      try {
        req.body = JSON.parse(buf.toString("utf8"));
      } catch {
        return res.status(400).json({ received: false, error: "invalid_json" });
      }
      next();
    });
  };
}

module.exports = { rawBodyJson };
