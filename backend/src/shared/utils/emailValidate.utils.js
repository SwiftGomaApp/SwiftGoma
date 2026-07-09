const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { valid: false, message: "L'adresse email est requise." };
  }

  const normalized = email.trim().toLowerCase();

  if (normalized.length > 255) {
    return { valid: false, message: "L'adresse email est trop longue." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
    return { valid: false, message: "L'adresse email est invalide." };
  }

  return { valid: true, email: normalized };
};

module.exports = { validateEmail };
