const express = require("express");
const {
  getSellerRiders,
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

RiderRouter.get("/", authorize("SELLER"), getSellerRiders);
RiderRouter.post("/", authorize("SELLER"), postCreateRider);
RiderRouter.post("/:id/suspend", authorize("SELLER"), postSuspendRider);
RiderRouter.post("/:id/reactivate", authorize("SELLER"), postReactivateRider);
RiderRouter.delete("/:id", authorize("SELLER"), deleteRiderHandler);

RiderRouter.get("/me/deliveries", authorize("RIDER"), getMyDeliveryHistory);

module.exports = RiderRouter;
