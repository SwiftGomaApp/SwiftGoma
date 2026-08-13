const express = require("express");
const {
  postDepositCallback,
  postPayoutCallback,
} = require("../controllers/pawapayCallback.controller");

const { webhookLimiter } = require("../../../common/middleware/rateLimiters");

const PawapayCallbackRouter = express.Router();

PawapayCallbackRouter.post("/deposit", webhookLimiter, postDepositCallback);
PawapayCallbackRouter.post("/payout", webhookLimiter, postPayoutCallback);

module.exports = PawapayCallbackRouter;
