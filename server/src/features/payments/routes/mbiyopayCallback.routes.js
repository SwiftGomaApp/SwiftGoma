const express = require("express");
const {
  postMbiyoPayCallback,
} = require("../controllers/mbiyopayCallback.controller");

const MbiyoPayCallbackRouter = express.Router();

MbiyoPayCallbackRouter.post("/", postMbiyoPayCallback);

module.exports = MbiyoPayCallbackRouter;
