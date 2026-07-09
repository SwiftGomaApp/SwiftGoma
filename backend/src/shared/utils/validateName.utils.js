const validateName = (name) => {
  if (!name || typeof name !== "string") {
    return { valid: false, message: "Le nom est requis." };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      valid: false,
      message: "Le nom doit contenir au moins 2 caractères.",
    };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: "Le nom est trop long." };
  }

  if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(trimmed)) {
    return {
      valid: false,
      message:
        "Le nom ne peut contenir que des lettres, espaces, apostrophes et tirets.",
    };
  }

  return { valid: true, name: trimmed };
};

module.exports = { validateName };
