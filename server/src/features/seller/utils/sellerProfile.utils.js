const {
  ForbiddenError,
  ConflictError,
  ValidationError,
} = require("../../../common/errors");
const { SELLER_PROFILE_CONFIG } = require("../config/sellerProfile.config");
const { isValidEmail, isValidPhone } = require("../../auth/utils/auth");

function isValidBusinessName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= SELLER_PROFILE_CONFIG.BUSINESS_NAME_MIN_LENGTH &&
    trimmed.length <= SELLER_PROFILE_CONFIG.BUSINESS_NAME_MAX_LENGTH
  );
}

function isValidAddress(address) {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  if (trimmed.length < 5 || trimmed.length > 200) return false;
  if (/[\r\n]/.test(trimmed)) return false;
  return true;
}

function isValidBusinessDescription(description) {
  if (!description || typeof description !== "string") return false;
  const trimmed = description.trim();
  return (
    trimmed.length >= SELLER_PROFILE_CONFIG.BUSINESS_DESCRIPTION_MIN_LENGTH &&
    trimmed.length <= SELLER_PROFILE_CONFIG.BUSINESS_DESCRIPTION_MAX_LENGTH
  );
}

function isValidCity(city) {
  if (!city) return false;
  return SELLER_PROFILE_CONFIG.ALLOWED_CITIES.includes(city);
}

function assertValidProfileInput(input) {
  const missing = SELLER_PROFILE_CONFIG.REQUIRED_FIELDS.filter(
    (field) => !input[field],
  );
  if (missing.length > 0) {
    throw new ValidationError(`Champs manquants : ${missing.join(", ")}.`);
  }

  if (!isValidBusinessName(input.businessName)) {
    throw new ValidationError(
      `Le nom du business doit contenir entre ${SELLER_PROFILE_CONFIG.BUSINESS_NAME_MIN_LENGTH} et ${SELLER_PROFILE_CONFIG.BUSINESS_NAME_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidBusinessDescription(input.businessDescription)) {
    throw new ValidationError(
      `La description doit contenir entre ${SELLER_PROFILE_CONFIG.BUSINESS_DESCRIPTION_MIN_LENGTH} et ${SELLER_PROFILE_CONFIG.BUSINESS_DESCRIPTION_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidEmail(input.contactEmail)) {
    throw new ValidationError("Adresse e-mail de contact invalide.");
  }
  if (!isValidPhone(input.contactPhone)) {
    throw new ValidationError("Numéro de téléphone de contact invalide.");
  }
  if (!isValidPhone(input.whatsappNumber)) {
    throw new ValidationError("Numéro WhatsApp invalide.");
  }
  if (!isValidCity(input.city)) {
    throw new ValidationError("Ville non prise en charge.");
  }
  if (!isValidAddress(input.address)) {
    throw new ValidationError(
      "Adresse invalide (5 à 200 caractères, sans retour à la ligne).",
    );
  }
}

function assertProfileEditable(profile) {
  if (!SELLER_PROFILE_CONFIG.EDITABLE_STATUSES.includes(profile.status)) {
    throw new ForbiddenError(
      `Ce profil ne peut pas être modifié car son statut est "${profile.status}".`,
    );
  }
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  const allowed =
    SELLER_PROFILE_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }
}

module.exports = {
  isValidBusinessName,
  isValidBusinessDescription,
  isValidCity,
  assertValidProfileInput,
  assertProfileEditable,
  assertValidStatusTransition,
  isValidAddress,
};
