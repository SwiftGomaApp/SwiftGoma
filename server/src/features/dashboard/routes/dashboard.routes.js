const express = require("express");
const {
  getOverview,
  getMetrics,
} = require("../controllers/dashboard.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const DashboardRouter = express.Router();

DashboardRouter.use(authenticate, authorize("ADMIN"));
DashboardRouter.get("/overview", getOverview);
DashboardRouter.get("/metrics", getMetrics);

module.exports = DashboardRouter;
