const express = require("express");
const {
  getPlans,
  getPlan,
  getPlanBySlugHandler,
  postCreatePlan,
  putUpdatePlan,
  putUpdatePlanPrice,
  postSetPlanActive,
} = require("../controllers/plan.controller");
const { authenticate } = require("../../../common/middleware/authenticate");
const { authorize } = require("../../../common/middleware/authorize");

const PlansRouter = express.Router();

PlansRouter.get("/", getPlans);
PlansRouter.get("/slug/:slug", getPlanBySlugHandler);
PlansRouter.get("/:id", getPlan);

PlansRouter.use(authenticate);
PlansRouter.post("/", authorize("ADMIN"), postCreatePlan);
PlansRouter.put("/:id", authorize("ADMIN"), putUpdatePlan);
PlansRouter.put("/:id/prices", authorize("ADMIN"), putUpdatePlanPrice);
PlansRouter.post("/:id/active", authorize("ADMIN"), postSetPlanActive);

module.exports = PlansRouter;
