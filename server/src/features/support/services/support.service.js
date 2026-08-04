const { getPrismaClient } = require("../../../config/prisma");
const { ValidationError } = require("../../../common/errors");
const { isValidEmail } = require("../../auth/utils/auth");
const { sendContactSupportEmail } = require("../../../common/emails");
const { BRAND } = require("../../../common/constants/brand");

const prisma = getPrismaClient();

const SUBJECT_LABELS = {
  general: "Question générale",
  account: "Compte et connexion",
  order: "Commande",
  payment: "Paiement / Retrait",
  seller: "Compte Vendeur",
  delivery: "Livraison",
  privacy: "Confidentialité / Données personnelles",
  other: "Autre",
};

async function submitContactMessage({ name, email, subject, message }) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new ValidationError("Veuillez indiquer votre nom.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Adresse e-mail invalide.");
  }
  if (!subject || !SUBJECT_LABELS[subject]) {
    throw new ValidationError("Veuillez choisir un sujet valide.");
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    throw new ValidationError("Veuillez saisir votre message.");
  }

  const contactMessage = await prisma.contactMessage.create({
    data: { name: name.trim(), email: email.trim(), subject, message: message.trim() },
  });

  try {
    await sendContactSupportEmail(BRAND.supportEmail, {
      name: contactMessage.name,
      email: contactMessage.email,
      subjectLabel: SUBJECT_LABELS[subject],
      message: contactMessage.message,
    });
  } catch (err) {
    console.error("[support] Failed to send contact notification email:", err.message);
  }

  return { id: contactMessage.id, received: true };
}

module.exports = { submitContactMessage };
