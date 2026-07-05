"use strict";

const express = require("express");
const {
  authenticate,
  requireRole,
} = require("../../auth/middlewares/authenticate.middleware");
const controllers = require("../controllers/subscription.controller");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RATE_LIMITS } = require("../constants/subscription.constants");

function makeLimiter({ windowMs, max }, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),
    message: { success: false, message },
  });
}

const readLimiter = makeLimiter(
  RATE_LIMITS.READ,
  "Trop de requêtes. Veuillez réessayer dans un instant.",
);

const mutateLimiter = makeLimiter(
  RATE_LIMITS.MUTATE,
  "Trop de tentatives sur cette action. Veuillez réessayer plus tard.",
);

const router = express.Router();

router.get("/plans", controllers.listPlans);
router.get("/plans/:slug", controllers.getPlanBySlug);

router.post(
  "/subscribe/initiate",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.subscribeInitiate,
);
router.post(
  "/subscribe/confirm",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.subscribeConfirm,
);

router.post(
  "/upgrade/initiate",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.upgradeInitiate,
);
router.post(
  "/upgrade/confirm",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.upgradeConfirm,
);

router.post(
  "/renew/initiate",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.renewInitiate,
);
router.post(
  "/renew/confirm",
  mutateLimiter,
  authenticate,
  requireRole("SELLER"),
  controllers.renewConfirm,
);

router.patch("/auto-renew", mutateLimiter, controllers.setAutoRenew);
router.post(
  "/cancel",
  mutateLimiter,
  authenticate,
  controllers.cancelSubscription,
);
router.get(
  "/me/:sellerProfileId",
  readLimiter,
  authenticate,
  controllers.getMySubscription,
);

router.use("/admin/plans", authenticate, requireRole("ADMIN"));

router.get("/admin/plans", controllers.listAllPlans);
router.post("/admin/plans", controllers.createPlan);
router.patch("/admin/plans/:id", controllers.updatePlan);
router.patch("/admin/plans/:id/status", controllers.setPlanActiveStatus);
router.put("/admin/plans/:id/prices", controllers.upsertPlanPrice);
router.get("/admin", readLimiter, controllers.getAllSubscriptionsAdmin);

module.exports = { subscriptionRouter: router };
