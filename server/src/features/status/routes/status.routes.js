const express = require("express");
const {
  getPublicStatus,
  createIncident,
  addIncidentUpdate,
} = require("../controllers/status.controller");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");

const router = express.Router();

router.get("/", getPublicStatus);

router.post("/incidents", authenticate, requireRole("ADMIN"), createIncident);
router.patch(
  "/incidents/:id",
  authenticate,
  requireRole("ADMIN"),
  addIncidentUpdate,
);

module.exports = { statusRouter: router };
