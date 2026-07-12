const express = require("express");

const rawBodyParser = express.json({
  limit: "1mb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString("utf8");
  },
});

module.exports = { rawBodyParser };
