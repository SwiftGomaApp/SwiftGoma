const express = require("express");
const {
  requestAddPhone,
  verifyAddPhone,
  requestUpdatePhone,
  verifyUpdatePhone,
} = require("../controllers/phone.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.use(authenticate, requireVerified);

router.post("/add/request", requestAddPhone);
router.post("/add/verify", verifyAddPhone);
router.post("/update/request", requestUpdatePhone);
router.post("/update/verify", verifyUpdatePhone);

module.exports = { phoneRouter: router };
