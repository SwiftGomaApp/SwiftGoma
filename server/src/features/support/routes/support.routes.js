const express = require("express");
const {
  postContactMessage,
  getContactMessages,
  getContactMessage,
  patchContactMessage,
  postAssignContactMessage,
} = require("../controllers/support.controller");
const { authLimiter } = require("../../../common/middleware/rateLimiters");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const SupportRouter = express.Router();

SupportRouter.post("/contact", authLimiter, postContactMessage);

SupportRouter.use(authenticate, authorize("ADMIN", "SUPPORT"));
SupportRouter.get("/messages", getContactMessages);
SupportRouter.get("/messages/:id", getContactMessage);
SupportRouter.patch("/messages/:id", patchContactMessage);
SupportRouter.post("/messages/:id/assign-me", postAssignContactMessage);

module.exports = SupportRouter;
