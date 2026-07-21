const express = require("express");
const { getOverview } = require("../controllers/dashboard.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const DashboardRouter = express.Router();

DashboardRouter.use(authenticate, authorize("ADMIN"));
DashboardRouter.get("/overview", getOverview);

module.exports = DashboardRouter;
