"use strict";

const express = require("express");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const planController = require("../controllers/subscription.controller");

const router = express.Router();

router.get("/plans", planController.listPlans);
router.get("/plans/:slug", planController.getPlanBySlug);

router.use("/admin/plans", authenticate, requireRole("ADMIN"));

router.get("/admin/plans", planController.listAllPlans);
router.post("/admin/plans", planController.createPlan);
router.patch("/admin/plans/:id", planController.updatePlan);
router.patch("/admin/plans/:id/status", planController.setPlanActiveStatus);
router.put("/admin/plans/:id/prices", planController.upsertPlanPrice);

module.exports = { subscriptionRouter: router };
