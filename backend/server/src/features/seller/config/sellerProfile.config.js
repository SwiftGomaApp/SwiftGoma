const SELLER_PROFILE_CONFIG = {
  BUSINESS_NAME_MIN_LENGTH: 2,
  BUSINESS_NAME_MAX_LENGTH: 80,
  BUSINESS_DESCRIPTION_MIN_LENGTH: 20,
  BUSINESS_DESCRIPTION_MAX_LENGTH: 500,

  DEFAULT_CITY: "Goma",
  ALLOWED_CITIES: ["Goma"],

  REQUIRED_FIELDS: [
    "businessName",
    "businessDescription",
    "logoUrl",
    "bannerUrl",
    "contactPhone",
    "contactEmail",
    "whatsappNumber",
    "address",
    "city",
  ],

  ALLOWED_STATUS_TRANSITIONS: {
    DRAFT: ["ACTIVE"],
    ACTIVE: ["SUSPENDED"],
    SUSPENDED: ["ACTIVE"],
  },

  EDITABLE_STATUSES: ["DRAFT", "ACTIVE"],
};

module.exports = { SELLER_PROFILE_CONFIG };
