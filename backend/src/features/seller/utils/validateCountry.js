const VALID_COUNTRIES = ["COD", "RWA"];

const validateCountry = (country) => {
  if (!country) {
    return { valid: false, message: "Le pays est requis." };
  }

  const normalized = String(country).trim().toUpperCase();

  if (!VALID_COUNTRIES.includes(normalized)) {
    return {
      valid: false,
      message: `Pays non pris en charge. Pays valides : ${VALID_COUNTRIES.join(", ")}.`,
    };
  }

  return { valid: true, country: normalized };
};

module.exports = { validateCountry, VALID_COUNTRIES };
