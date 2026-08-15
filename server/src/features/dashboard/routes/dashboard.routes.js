const express = require("express");
const {
  getOverview,
  getMetrics,
  getSupportOverviewHandler,
  getSupportMetricsHandler,
  getAccountantOverviewHandler,
} = require("../controllers/dashboard.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const DashboardRouter = express.Router();

DashboardRouter.use(authenticate);

DashboardRouter.get(
  "/support-overview",
  authorize("ADMIN", "SUPPORT"),
  getSupportOverviewHandler,
);
DashboardRouter.get(
  "/support-metrics",
  authorize("ADMIN", "SUPPORT"),
  getSupportMetricsHandler,
);
DashboardRouter.get(
  "/accountant-overview",
  authorize("ADMIN", "ACCOUNTANT"),
  getAccountantOverviewHandler,
);

DashboardRouter.use(authorize("ADMIN"));
DashboardRouter.get("/overview", getOverview);
DashboardRouter.get("/metrics", getMetrics);

module.exports = DashboardRouter;
