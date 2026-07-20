const { ConflictError, ValidationError } = require("../../../common/errors");
const { SELLER_KYC_CONFIG } = require("../config/sellerKyc.config");

function isValidIdDocumentType(type) {
  return SELLER_KYC_CONFIG.ID_DOCUMENT_TYPES.includes(type);
}

function assertValidKycInput(input) {
  const missing = SELLER_KYC_CONFIG.REQUIRED_FIELDS.filter(
    (field) => !input[field],
  );
  if (missing.length > 0) {
    throw new ValidationError(`Champs manquants : ${missing.join(", ")}.`);
  }

  if (!isValidIdDocumentType(input.idDocumentType)) {
    throw new ValidationError("Type de pièce d'identité invalide.");
  }

  const [rccmNumberField, rccmDocField] = SELLER_KYC_CONFIG.RCCM_PAIRED_FIELDS;
  const hasRccmNumber = Boolean(input[rccmNumberField]);
  const hasRccmDoc = Boolean(input[rccmDocField]);
  if (hasRccmNumber !== hasRccmDoc) {
    throw new ValidationError(
      "Le numéro RCCM et le document RCCM doivent être fournis ensemble, ou ni l'un ni l'autre.",
    );
  }
}

function assertValidStatusTransition(currentStatus, nextStatus) {
  const allowed =
    SELLER_KYC_CONFIG.ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ConflictError(
      `Transition de statut KYC invalide : "${currentStatus}" → "${nextStatus}".`,
    );
  }
}

function assertResubmittable(kyc) {
  if (!SELLER_KYC_CONFIG.RESUBMITTABLE_STATUSES.includes(kyc.status)) {
    throw new ConflictError(
      `Ce dossier KYC ne peut pas être resoumis car son statut est "${kyc.status}".`,
    );
  }
}

module.exports = {
  isValidIdDocumentType,
  assertValidKycInput,
  assertValidStatusTransition,
  assertResubmittable,
};
