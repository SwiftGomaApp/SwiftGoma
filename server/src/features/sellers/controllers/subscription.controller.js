"use strict";

const { catchAsync } = require("../../../shared/utils/catchAsync");
const planService = require("../services/subscription.service");
const { errors } = require("../../../shared/errors/app.error");

/* ── Public ───────────────────────────────────────────────────────────── */

const listPlans = catchAsync(async (req, res) => {
  const { country, currency } = req.query;
  const plans = await planService.listPlans({ country, currency });
  res.status(200).json({ success: true, data: plans });
});

const getPlanBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { country, currency } = req.query;
  const plan = await planService.getPlanBySlug({ slug, country, currency });
  res.status(200).json({ success: true, data: plan });
});

/* ── Admin ────────────────────────────────────────────────────────────── */

const listAllPlans = catchAsync(async (req, res) => {
  const plans = await planService.listAllPlans();
  res.status(200).json({ success: true, data: plans });
});

const createPlan = catchAsync(async (req, res) => {
  const plan = await planService.createPlan(req.body);
  res.status(201).json({ success: true, data: plan });
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  res.status(200).json({ success: true, data: plan });
});

const setPlanActiveStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    throw errors.badRequest("Le champ 'isActive' (booléen) est requis.");
  }
  const plan = await planService.setPlanActiveStatus(req.params.id, isActive);
  res.status(200).json({ success: true, data: plan });
});

const upsertPlanPrice = catchAsync(async (req, res) => {
  const { country, currency, priceMonthly, isDefault } = req.body;
  const price = await planService.upsertPlanPrice({
    planId: req.params.id,
    country,
    currency,
    priceMonthly,
    isDefault,
  });
  res.status(200).json({ success: true, data: price });
});

module.exports = {
  listPlans,
  getPlanBySlug,
  listAllPlans,
  createPlan,
  updatePlan,
  setPlanActiveStatus,
  upsertPlanPrice,
};
