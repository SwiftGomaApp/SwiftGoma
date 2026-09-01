const SHOP_CONFIG = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 60,

  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 500,

  SUPPORTED_DELIVERY_CURRENCIES: ["USD", "CDF"],
  // Bounds are defined once, in the base currency below. Any other
  // supported currency's limit is derived at validation time from the
  // live rate in the ExchangeRate table (managed under Admin > Exchange
  // Rates), so it always matches the same real-world value — no more
  // hardcoded per-currency numbers that can silently drift apart.
  DELIVERY_FEE_BASE_CURRENCY: "USD",
  DELIVERY_FEE_MIN_BASE: 0.5,
  DELIVERY_FEE_MAX_BASE: 2,

  ALLOWED_STATUS_TRANSITIONS: {
    DRAFT: ["PUBLISHED"],
    PUBLISHED: ["SUSPENDED", "DRAFT"],
    SUSPENDED: ["PUBLISHED"],
  },

  DELETABLE_STATUSES: ["DRAFT", "SUSPENDED"],

  REQUIRES_ACTIVE_SUBSCRIPTION_TO_PUBLISH: true,
};

module.exports = { SHOP_CONFIG };
