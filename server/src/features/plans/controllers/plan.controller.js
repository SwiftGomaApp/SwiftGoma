const {
  listPlans,
  getPlanById,
  getPlanBySlug,
  createPlan,
  updatePlan,
  updatePlanPrice,
  setPlanActive,
} = require("../services/plans.service");

async function getPlans(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const plans = await listPlans({ includeInactive });
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    next(err);
  }
}

async function getPlan(req, res, next) {
  try {
    const plan = await getPlanById(req.params.id);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function getPlanBySlugHandler(req, res, next) {
  try {
    const plan = await getPlanBySlug(req.params.slug);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function postCreatePlan(req, res, next) {
  try {
    const plan = await createPlan({
      slug: req.body.slug,
      name: req.body.name,
      maxProducts: req.body.maxProducts,
      maxPhotosPerProduct: req.body.maxPhotosPerProduct,
      maxShops: req.body.maxShops,
      prioritySupport: req.body.prioritySupport,
      sortOrder: req.body.sortOrder,
    });
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function putUpdatePlan(req, res, next) {
  try {
    const plan = await updatePlan(req.params.id, {
      name: req.body.name,
      maxProducts: req.body.maxProducts,
      maxPhotosPerProduct: req.body.maxPhotosPerProduct,
      maxShops: req.body.maxShops,
      prioritySupport: req.body.prioritySupport,
      isActive: req.body.isActive,
      sortOrder: req.body.sortOrder,
    });
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function putUpdatePlanPrice(req, res, next) {
  try {
    const price = await updatePlanPrice(req.params.id, {
      billingCycle: req.body.billingCycle,
      currency: req.body.currency,
      amount: req.body.amount,
    });
    res.status(200).json({ success: true, data: price });
  } catch (err) {
    next(err);
  }
}

async function postSetPlanActive(req, res, next) {
  try {
    const plan = await setPlanActive(req.params.id, req.body.isActive);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPlans,
  getPlan,
  getPlanBySlugHandler,
  postCreatePlan,
  putUpdatePlan,
  putUpdatePlanPrice,
  postSetPlanActive,
};
