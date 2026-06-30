const express = require("express");
const {
  requestAddSecondaryEmail,
  verifyAddSecondaryEmail,
  removeSecondaryEmail,
  requestUpdateEmail,
  verifyUpdateEmail,
  requestAddPrimaryEmail,
  verifyAddPrimaryEmail,
  verifyRemoveSecondaryEmail,
} = require("../controllers/email.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.use(authenticate, requireVerified);

router.post("/secondary/request", requestAddSecondaryEmail);
router.post("/secondary/verify", verifyAddSecondaryEmail);
router.post("/secondary/remove/request", removeSecondaryEmail);
router.post("/secondary/remove/verify", verifyRemoveSecondaryEmail);

router.post("/update/request", requestUpdateEmail);
router.post("/update/verify", verifyUpdateEmail);
router.post("/add/request", requestAddPrimaryEmail);
router.post("/add/verify", verifyAddPrimaryEmail);

module.exports = { emailRouter: router };
