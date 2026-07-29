const express = require("express");
const {
  postInitiatePayin,
  postInitiatePayout,
  getTransactionStatus,
  getBalances,
  getNetworkBalancesHandler,
  getCountriesHandler,
} = require("../controllers/mbiopay.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const MbiyoPayRouter = express.Router();

MbiyoPayRouter.use(authenticate, authorize("ADMIN"));

MbiyoPayRouter.post("/payin", postInitiatePayin);
MbiyoPayRouter.post("/payout", postInitiatePayout);
MbiyoPayRouter.get("/transactions/:transactionId", getTransactionStatus);
MbiyoPayRouter.get("/balances", getBalances);
MbiyoPayRouter.get("/balances/networks", getNetworkBalancesHandler);
MbiyoPayRouter.get("/countries", getCountriesHandler);

module.exports = MbiyoPayRouter;
