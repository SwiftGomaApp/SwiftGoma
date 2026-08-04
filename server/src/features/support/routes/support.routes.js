const express = require("express");
const { postContactMessage } = require("../controllers/support.controller");
const { authLimiter } = require("../../../common/middleware/rateLimiters");

const SupportRouter = express.Router();

SupportRouter.post("/contact", authLimiter, postContactMessage);

module.exports = SupportRouter;
