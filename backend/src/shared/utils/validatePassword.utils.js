const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Le mot de passe est requis." };
  }

  if (password.length < 8) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }

  if (password.length > 72) {
    return { valid: false, message: "Le mot de passe est trop long." };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins une lettre majuscule.",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins un chiffre.",
    };
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Le mot de passe doit contenir au moins un caractère spécial.",
    };
  }

  return { valid: true };
};

module.exports = { validatePassword };
