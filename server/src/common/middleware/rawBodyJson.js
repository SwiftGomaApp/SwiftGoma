const express = require("express");

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
