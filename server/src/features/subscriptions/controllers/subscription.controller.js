const {
  subscribeToPlan,
  confirmSubscriptionPayment,
  failSubscriptionPayment,
  getSubscriptionBySellerId,
  listPaymentHistory,
  cancelSubscription,
  reactivateCanceledSubscription,
  upgradeSubscription,
  getSubscriptionStats,
  getSubscriptionRevenue,
} = require("../services/subscription.service");
const {
  checkDepositStatus,
} = require("../../payments/services/pawapay.service");
const { NotFoundError } = require("../../../common/errors");
const { getPrismaClient } = require("../../../config/prisma");

async function getSellerProfileIdForUser(userId) {
  const prisma = getPrismaClient();
  const profile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw new NotFoundError("Profil vendeur introuvable.");
  return profile.id;
}

async function postSubscribe(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);

    const result = await subscribeToPlan({
      sellerProfileId,
      planId: req.body.planId,
      billingCycle: req.body.billingCycle,
      currency: req.body.currency,
      payerPhoneNumber: req.body.payerPhoneNumber,
      country: req.body.country,
      provider: req.body.provider,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getMySubscription(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const subscription = await getSubscriptionBySellerId(sellerProfileId);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
}

async function getMyPaymentHistory(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const result = await listPaymentHistory(sellerProfileId, {
      page: req.query.page,
      limit: req.query.limit,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function postCancelMySubscription(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const subscription = await cancelSubscription(sellerProfileId);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
}

async function postCheckPaymentStatus(req, res, next) {
  try {
    const { depositId } = req.params;

    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    await assertPaymentOwnedBySeller(depositId, sellerProfileId);

    const statusResult = await checkDepositStatus(depositId);

    const depositStatus = statusResult?.data?.status;

    if (depositStatus === "COMPLETED") {
      const result = await confirmSubscriptionPayment(depositId);
      return res.status(200).json({
        success: true,
        data: { ...result, pawapayStatus: depositStatus },
      });
    }

    if (depositStatus === "FAILED" || depositStatus === "REJECTED") {
      const result = await failSubscriptionPayment(
        depositId,
        statusResult?.data?.failureReason?.failureMessage || "Payment failed",
      );
      return res.status(200).json({
        success: true,
        data: { ...result, pawapayStatus: depositStatus },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        depositId,
        pawapayStatus: depositStatus,
        message: "Paiement toujours en attente.",
      },
    });
  } catch (err) {
    next(err);
  }
}

async function postReactivateMySubscription(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);
    const subscription = await reactivateCanceledSubscription(sellerProfileId);
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    next(err);
  }
}

async function postUpgrade(req, res, next) {
  try {
    const sellerProfileId = await getSellerProfileIdForUser(req.user.id);

    const result = await upgradeSubscription({
      sellerProfileId,
      newPlanId: req.body.newPlanId,
      billingCycle: req.body.billingCycle,
      currency: req.body.currency,
      payerPhoneNumber: req.body.payerPhoneNumber,
      country: req.body.country,
      provider: req.body.provider,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await getSubscriptionStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

async function getRevenue(req, res, next) {
  try {
    const revenue = await getSubscriptionRevenue();
    res.status(200).json({ success: true, data: revenue });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  postSubscribe,
  postUpgrade,
  getMySubscription,
  getMyPaymentHistory,
  postCancelMySubscription,
  getRevenue,
  postCheckPaymentStatus,
  postReactivateMySubscription,
  getStats,
};
