const VALID_DRC_PREFIXES = [
  "81",
  "82",
  "83",
  "84",
  "85",
  "89",
  "90",
  "91",
  "97",
  "98",
  "99",
];

const VALID_RW_PREFIXES = ["72", "73", "78", "79", "75", "76"];

const normalizePhone = (phone) => {
  let normalized = phone.trim().replace(/[\s\-().]/g, "");

  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = "+243" + normalized.slice(1);
  }

  if (normalized.startsWith("243") && !normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }

  if (normalized.startsWith("0") && normalized.length === 10) {
    normalized = "+250" + normalized.slice(1);
  }

  if (normalized.startsWith("250") && !normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }

  return normalized;
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== "string") {
    return { valid: false, message: "Le numéro de téléphone est requis." };
  }

  const normalized = normalizePhone(phone);

  if (normalized.startsWith("+243")) {
    if (!/^\+243\d{9}$/.test(normalized)) {
      return {
        valid: false,
        message:
          "Le numéro de téléphone congolais est invalide. Format attendu : +243 8XX XXX XXX",
      };
    }

    const prefix = normalized.slice(4, 6);
    if (!VALID_DRC_PREFIXES.includes(prefix)) {
      return {
        valid: false,
        message:
          "Ce numéro ne correspond à aucun opérateur reconnu en RDC (Airtel, Vodacom, Orange, Africell).",
      };
    }

    return { valid: true, phone: normalized, country: "CD" };
  }

  if (normalized.startsWith("+250")) {
    if (!/^\+250\d{9}$/.test(normalized)) {
      return {
        valid: false,
        message:
          "Le numéro de téléphone rwandais est invalide. Format attendu : +250 7XX XXX XXX",
      };
    }

    const prefix = normalized.slice(4, 6);
    if (!VALID_RW_PREFIXES.includes(prefix)) {
      return {
        valid: false,
        message:
          "Ce numéro ne correspond à aucun opérateur reconnu au Rwanda (MTN, Airtel, Best).",
      };
    }

    return { valid: true, phone: normalized, country: "RW" };
  }
  return {
    valid: false,
    message:
      "Seuls les numéros de la RDC (+243) et du Rwanda (+250) sont acceptés.",
  };
};

const detectIdentifierType = (identifier) => {
  if (!identifier || typeof identifier !== "string") return null;

  const val = identifier.trim();

  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return "email";

  const normalized = normalizePhone(val);
  if (normalized.startsWith("+243") || normalized.startsWith("+250"))
    return "phone";

  return null;
};

module.exports = { validatePhone, normalizePhone, detectIdentifierType };
