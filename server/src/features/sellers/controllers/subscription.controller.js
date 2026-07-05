"use strict";

const { catchAsync } = require("../../../shared/utils/catchAsync");
const subscriptionService = require("../services/subscription.service");
const { errors } = require("../../../shared/errors/app.error");

function requirePendingConfirmation(body) {
  const { pendingId, otpCode } = body;
  if (!pendingId || !otpCode) {
    throw errors.badRequest("pendingId et otpCode sont requis.");
  }
  return { pendingId, otpCode };
}

/* ── Public ───────────────────────────────────────────────────────────── */

const listPlans = catchAsync(async (req, res) => {
  const { country, currency } = req.query;
  const plans = await subscriptionService.listPlans({ country, currency });
  res.status(200).json({ success: true, data: plans });
});

const getPlanBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const { country, currency } = req.query;
  const plan = await subscriptionService.getPlanBySlug({
    slug,
    country,
    currency,
  });
  res.status(200).json({ success: true, data: plan });
});

/* ── Admin ────────────────────────────────────────────────────────────── */

const listAllPlans = catchAsync(async (req, res) => {
  const plans = await subscriptionService.listAllPlans();
  res.status(200).json({ success: true, data: plans });
});

const createPlan = catchAsync(async (req, res) => {
  const plan = await subscriptionService.createPlan(req.body);
  res.status(201).json({ success: true, data: plan });
});

const updatePlan = catchAsync(async (req, res) => {
  const plan = await subscriptionService.updatePlan(req.params.id, req.body);
  res.status(200).json({ success: true, data: plan });
});

const setPlanActiveStatus = catchAsync(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    throw errors.badRequest("Le champ 'isActive' (booléen) est requis.");
  }
  const plan = await subscriptionService.setPlanActiveStatus(
    req.params.id,
    isActive,
  );
  res.status(200).json({ success: true, data: plan });
});

const upsertPlanPrice = catchAsync(async (req, res) => {
  const { country, currency, priceMonthly, isDefault } = req.body;
  const price = await subscriptionService.upsertPlanPrice({
    planId: req.params.id,
    country,
    currency,
    priceMonthly,
    isDefault,
  });
  res.status(200).json({ success: true, data: price });
});

const subscribeInitiate = catchAsync(async (req, res) => {
  const result = await subscriptionService.initiateSubscribe(
    req.user,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: "Un code de vérification a été envoyé.",
    data: result,
  });
});

const subscribeConfirm = catchAsync(async (req, res) => {
  const { pendingId, otpCode } = requirePendingConfirmation(req.body);
  const result = await subscriptionService.confirmSubscribe(req.user, {
    pendingId,
    otpCode,
  });
  res.status(202).json({ success: true, data: result });
});

/* ── UPGRADE ────────────────────────────────────────────────────────── */

const upgradeInitiate = catchAsync(async (req, res) => {
  const result = await subscriptionService.initiateUpgrade(req.user, req.body);
  res.status(200).json({
    success: true,
    message: "Un code de vérification a été envoyé.",
    data: result,
  });
});

const upgradeConfirm = catchAsync(async (req, res) => {
  const { pendingId, otpCode } = requirePendingConfirmation(req.body);
  const result = await subscriptionService.confirmUpgrade(req.user, {
    pendingId,
    otpCode,
  });
  res.status(202).json({ success: true, data: result });
});

/* ── RENEW ──────────────────────────────────────────────────────────── */

const renewInitiate = catchAsync(async (req, res) => {
  const result = await subscriptionService.initiateRenew(req.user, req.body);
  res.status(200).json({
    success: true,
    message: "Un code de vérification a été envoyé.",
    data: result,
  });
});

const renewConfirm = catchAsync(async (req, res) => {
  const { pendingId, otpCode } = requirePendingConfirmation(req.body);
  const result = await subscriptionService.confirmRenew(req.user, {
    pendingId,
    otpCode,
  });
  res.status(202).json({ success: true, data: result });
});

/* ── CANCEL ─────────────────────────────────────────────────────────── */

const cancelSubscription = catchAsync(async (req, res) => {
  const { sellerProfileId } = req.body;
  if (!sellerProfileId) throw errors.badRequest("sellerProfileId est requis.");

  const user = req.user;
  console.log("User:", user);

  const result = await subscriptionService.cancelSubscription(user, {
    sellerProfileId,
  });
  res.status(200).json({ success: true, data: result });
});

/* ── AUTO-RENEW ─────────────────────────────────────────────────────── */

const setAutoRenew = catchAsync(async (req, res) => {
  const { sellerProfileId, autoRenew } = req.body;
  if (!sellerProfileId || typeof autoRenew !== "boolean") {
    throw errors.badRequest(
      "sellerProfileId et autoRenew (booléen) sont requis.",
    );
  }

  const result = await subscriptionService.setAutoRenew(req.user, {
    sellerProfileId,
    autoRenew,
  });
  res.status(200).json({ success: true, data: result });
});

/* ── READS ──────────────────────────────────────────────────────────── */

const getMySubscription = catchAsync(async (req, res) => {
  const sellerProfileId =
    req.params.sellerProfileId || req.query.sellerProfileId;
  if (!sellerProfileId) throw errors.badRequest("sellerProfileId est requis.");

  const result = await subscriptionService.getMySubscription(req.user, {
    sellerProfileId,
  });
  res.status(200).json({ success: true, data: result });
});

const getAllSubscriptionsAdmin = catchAsync(async (req, res) => {
  const { page, limit, status, country, planId, search } = req.query;
  const result = await subscriptionService.getAllSubscriptionsAdmin({
    page,
    limit,
    status,
    country,
    planId,
    search,
  });
  res.status(200).json({ success: true, ...result });
});

/* ── WEBHOOK ────────────────────────────────────────────────────────── */

const handleSubscriptionWebhook = catchAsync(async (req, res) => {
  const callback = req.body;
  // TODO: verify signature here if signedCallbacks is enabled (RFC-9421 headers)
  console.log("[subscription] pawapay deposit callback:", callback);

  await subscriptionService.handleDepositWebhook(callback);

  res.sendStatus(200);
});

module.exports = {
  listPlans,
  getPlanBySlug,
  listAllPlans,
  createPlan,
  updatePlan,
  setPlanActiveStatus,
  upsertPlanPrice,
  subscribeInitiate,
  subscribeConfirm,
  upgradeInitiate,
  upgradeConfirm,
  renewInitiate,
  renewConfirm,
  cancelSubscription,
  setAutoRenew,
  getMySubscription,
  getAllSubscriptionsAdmin,
  handleSubscriptionWebhook,
};
