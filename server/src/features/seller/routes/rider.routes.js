const express = require("express");
const {
  postCreateRider,
  postSuspendRider,
  postReactivateRider,
  deleteRiderHandler,
  getMyDeliveryHistory,
} = require("../controllers/rider.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const RiderRouter = express.Router();

RiderRouter.use(authenticate);

// Vendeur — gestion de ses propres livreurs
RiderRouter.post("/", authorize("SELLER"), postCreateRider);
RiderRouter.post("/:id/suspend", authorize("SELLER"), postSuspendRider);
RiderRouter.post("/:id/reactivate", authorize("SELLER"), postReactivateRider);
RiderRouter.delete("/:id", authorize("SELLER"), deleteRiderHandler);

// Rider — son propre historique
RiderRouter.get("/me/deliveries", authorize("RIDER"), getMyDeliveryHistory);

module.exports = RiderRouter;
