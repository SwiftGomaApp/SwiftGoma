const ORDER_CONFIG = {
  MIN_ITEMS: 1,
  MAX_ITEMS: 50,
  MAX_QUANTITY_PER_ITEM: 1000,

  QR_TOKEN_BYTES: 24,

  SELLER_REVIEW_TIMEOUT_MINUTES: 120,

  DELIVERY_ADDRESS_MIN_LENGTH: 10,
  DELIVERY_ADDRESS_MAX_LENGTH: 300,

  ALLOWED_STATUS_TRANSITIONS: {
    AWAITING_PAYMENT: ["PENDING_SELLER_REVIEW", "FAILED", "CANCELLED"],
    PENDING_SELLER_REVIEW: ["ACCEPTED", "REJECTED", "CANCELLED", "EXPIRED"],
    // No seller action currently transitions an order into PREPARING (no
    // route/controller sets it), so an accepted order must be able to go
    // straight to READY_FOR_PICKUP/RIDER_ASSIGNED — otherwise every accepted
    // order is stuck forever. PREPARING is kept as a valid target in case a
    // future "seller marks order as preparing" step is added.
    ACCEPTED: ["PREPARING", "READY_FOR_PICKUP", "RIDER_ASSIGNED", "CANCELLED"],
    PREPARING: ["READY_FOR_PICKUP", "RIDER_ASSIGNED", "CANCELLED"],
    READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
    RIDER_ASSIGNED: ["PICKED_UP", "CANCELLED"],
    PICKED_UP: ["ON_THE_WAY", "FAILED"],
    ON_THE_WAY: ["DELIVERED", "FAILED"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [],
    REJECTED: [],
    CANCELLED: [],
    EXPIRED: [],
    FAILED: [],
  },

  SUPPORTED_CURRENCIES: ["USD", "CDF"],

  PICKUP_ONLY_STATUSES: ["READY_FOR_PICKUP"],
  DELIVERY_ONLY_STATUSES: [
    "RIDER_ASSIGNED",
    "PICKED_UP",
    "ON_THE_WAY",
    "DELIVERED",
  ],

  CANCELLABLE_STATUSES: [
    "AWAITING_PAYMENT",
    "PENDING_SELLER_REVIEW",
    "ACCEPTED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "RIDER_ASSIGNED",
  ],
};

module.exports = { ORDER_CONFIG };
