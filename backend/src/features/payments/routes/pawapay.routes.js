const express = require("express");
const {
  handleDepositCallback,
  handlePayoutCallback,
  handleRefundCallback,
} = require("../controllers/pawapay.callback.controller");

const router = express.Router();

router.post("/deposit", handleDepositCallback);
router.post("/payout", handlePayoutCallback);
router.post("/refund", handleRefundCallback);

module.exports = { pawapayCallbackRouter: router };
