const express = require("express");
const {
  getIncidents,
  postCreateIncident,
  patchUpdateIncident,
} = require("../controllers/incident.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const IncidentRouter = express.Router();

IncidentRouter.get("/", getIncidents);

IncidentRouter.post(
  "/",
  authenticate,
  authorize("ADMIN", "SUPPORT"),
  postCreateIncident,
);
IncidentRouter.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPPORT"),
  patchUpdateIncident,
);
IncidentRouter.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN", "SUPPORT"),
  patchUpdateIncident,
);

module.exports = IncidentRouter;
