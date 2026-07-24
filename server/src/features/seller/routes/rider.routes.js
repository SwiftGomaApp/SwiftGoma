const express = require("express");
const {
  postCreateRider,
  postSuspendRider,
  postReactivateRider,
  deleteRiderHandler,
  getMyDeliveryHistory,
} = require("../controllers/rider.controller");
const { authenticate } = require("../../../common/middleware/authenticate");

const RiderRouter = express.Router();

RiderRouter.use(authenticate);

// Vendeur — gestion de ses propres livreurs
RiderRouter.post("/", postCreateRider);
RiderRouter.post("/:id/suspend", postSuspendRider);
RiderRouter.post("/:id/reactivate", postReactivateRider);
RiderRouter.delete("/:id", deleteRiderHandler);

// Rider — son propre historique
RiderRouter.get("/me/deliveries", getMyDeliveryHistory);

module.exports = RiderRouter;
