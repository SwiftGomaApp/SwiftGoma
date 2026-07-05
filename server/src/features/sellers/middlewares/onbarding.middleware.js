"use strict";

const { prisma } = require("../../../config/db.config");
const { errors } = require("../../../shared/errors/app.error");

const STAGE_ORDER = [
  "PENDING_KYC",
  "KYC_REJECTED",
  "PENDING_SUBSCRIPTION",
  "PENDING_PAYOUT",
  "PENDING_SHOP_SETUP",
  "ACTIVE",
];

const requireOnboardingStage = (minStage) => {
  const minIndex = STAGE_ORDER.indexOf(minStage);
  if (minIndex === -1) {
    throw new Error(`Unknown onboarding stage: ${minStage}`);
  }

  return async (req, res, next) => {
    try {
      const profile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!profile) throw errors.notFound("Profil vendeur introuvable.");

      if (profile.onboardingStatus === "SUSPENDED") {
        throw errors.forbidden();
      }

      if (STAGE_ORDER.indexOf(profile.onboardingStatus) < minIndex) {
        throw errors.forbidden();
      }

      req.sellerProfile = profile;
      next();
    } catch (err) {
      next(err);
    }
  };
};

const requireNotSuspended = async (req, res, next) => {
  try {
    const profile = await prisma.sellerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (profile?.onboardingStatus === "SUSPENDED") {
      throw errors.forbidden();
    }

    if (profile) req.sellerProfile = profile;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireOnboardingStage, requireNotSuspended };
