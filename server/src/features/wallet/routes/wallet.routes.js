const express = require("express");
const {
  getMyWallet,
  getMyWalletTransactions,
  postRequestPayoutOtp,
  postInitiatePayout,
} = require("../controllers/wallet.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");
const { paymentLimiter } = require("../../../common/middleware/rateLimiters");

const WalletRouter = express.Router();

WalletRouter.use(authenticate, authorize("SELLER"));

WalletRouter.get("/me", getMyWallet);
WalletRouter.get("/me/transactions", getMyWalletTransactions);

WalletRouter.post("/payout/otp", paymentLimiter, postRequestPayoutOtp);
WalletRouter.post("/payout", paymentLimiter, postInitiatePayout);

module.exports = WalletRouter;
