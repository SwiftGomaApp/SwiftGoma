const express = require("express");
const { rawBodyParser } = require("../middleware/rawBodyParser");
const {
  verifyCallbackSignature,
} = require("../middleware/verifyCallbackSignature");
const {
  handleDepositCallback,
  handlePayoutCallback,
  handleRefundCallback,
  getPlatformWalletBalance,
  getActiveConfigurationHandler,
  getProviderAvailabilityHandler,
  predictProviderHandler,
} = require("../controllers/pawapay.controller");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");

const jsonBodyParser = express.json();

const pawapayRouter = express.Router();

pawapayRouter.post(
  "/deposits",
  rawBodyParser,
  verifyCallbackSignature,
  handleDepositCallback,
);
pawapayRouter.post(
  "/payouts",
  rawBodyParser,
  verifyCallbackSignature,
  handlePayoutCallback,
);
pawapayRouter.post(
  "/refunds",
  rawBodyParser,
  verifyCallbackSignature,
  handleRefundCallback,
);

pawapayRouter.get(
  "/wallet-balance",
  authenticate,
  requireRole("ADMIN"),
  getPlatformWalletBalance,
);

pawapayRouter.get("/active-conf", authenticate, getActiveConfigurationHandler);
pawapayRouter.get(
  "/availability",
  authenticate,
  getProviderAvailabilityHandler,
);
pawapayRouter.post(
  "/predict-provider",
  jsonBodyParser,
  authenticate,
  predictProviderHandler,
);

module.exports = { pawapayRouter };
