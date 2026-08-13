const express = require("express");
const {
  postMbiyoPayCallback,
} = require("../controllers/mbiyopayCallback.controller");

const { webhookLimiter } = require("../../../common/middleware/rateLimiters");

const MbiyoPayCallbackRouter = express.Router();

MbiyoPayCallbackRouter.post("/", webhookLimiter, postMbiyoPayCallback);

module.exports = MbiyoPayCallbackRouter;
