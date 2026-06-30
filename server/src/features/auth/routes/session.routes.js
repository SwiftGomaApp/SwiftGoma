const express = require("express");
const {
  removeSession,
  removeAllOtherSessions,
} = require("../controllers/session.controller");
const {
  authenticate,
  requireVerified,
} = require("../middlewares/authenticate.middleware");

const router = express.Router();

router.delete("/all", authenticate, requireVerified, removeAllOtherSessions);
router.delete("/:id", authenticate, requireVerified, removeSession);

module.exports = { sessionRouter: router };
