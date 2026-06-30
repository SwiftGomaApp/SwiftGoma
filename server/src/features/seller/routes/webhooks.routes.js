const express = require("express");
const { handlePawapayWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/pawapay", handlePawapayWebhook);

module.exports = { webhookRouter: router };
