const express = require("express");
const {
  postInitiatePayin,
  postInitiatePayout,
  postRequestPayoutApproval,
  postConfirmPayout,
  getPayoutHistory,
  getTransactionStatus,
  getBalances,
  getNetworkBalancesHandler,
  getCountriesHandler,
} = require("../controllers/mbiopay.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const FINANCE_READ = authorize("ADMIN", "ACCOUNTANT");

const MbiyoPayRouter = express.Router();

MbiyoPayRouter.use(authenticate);

MbiyoPayRouter.post("/payin", authorize("ADMIN"), postInitiatePayin);
MbiyoPayRouter.post("/payout", authorize("ADMIN"), postInitiatePayout);
MbiyoPayRouter.post(
  "/payout/request-approval",
  authorize("ADMIN"),
  postRequestPayoutApproval,
);
MbiyoPayRouter.post("/payout/confirm", authorize("ADMIN"), postConfirmPayout);
MbiyoPayRouter.get("/payout/history", FINANCE_READ, getPayoutHistory);
MbiyoPayRouter.get("/transactions/:transactionId", FINANCE_READ, getTransactionStatus);
MbiyoPayRouter.get("/balances", FINANCE_READ, getBalances);
MbiyoPayRouter.get("/balances/networks", FINANCE_READ, getNetworkBalancesHandler);
MbiyoPayRouter.get("/countries", FINANCE_READ, getCountriesHandler);

module.exports = MbiyoPayRouter;
