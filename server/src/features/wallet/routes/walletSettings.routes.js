const express = require("express");
const {
  postCreateWalletSettings,
  getMyWalletSettings,
  putUpdateWalletSettings,
} = require("../controllers/walletSettings.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const WalletSettingsRouter = express.Router();

WalletSettingsRouter.use(authenticate);

WalletSettingsRouter.post("/", postCreateWalletSettings);
WalletSettingsRouter.get("/me", getMyWalletSettings);
WalletSettingsRouter.put("/", putUpdateWalletSettings);

module.exports = WalletSettingsRouter;
