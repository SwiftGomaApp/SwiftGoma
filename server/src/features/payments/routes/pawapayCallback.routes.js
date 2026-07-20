const express = require("express");
const {
  postDepositCallback,
} = require("../controllers/pawapayCallback.controller");

const PawapayCallbackRouter = express.Router();

PawapayCallbackRouter.post("/deposit", postDepositCallback);
// PawapayCallbackRouter.post("/payout", postPayoutCallback);
// PawapayCallbackRouter.post("/refund", postRefundCallback);

module.exports = PawapayCallbackRouter;
