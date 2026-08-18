const { ValidationError, ConflictError } = require("../../../common/errors");
const { HERO_SLIDE_CONFIG } = require("../config/heroslides.config");

function isValidRole(role) {
  return HERO_SLIDE_CONFIG.ALLOWED_ROLES.includes(role);
}

function isValidTitle(title) {
  if (!title || typeof title !== "string") return false;
  const trimmed = title.trim();
  return (
    trimmed.length >= HERO_SLIDE_CONFIG.TITLE_MIN_LENGTH &&
    trimmed.length <= HERO_SLIDE_CONFIG.TITLE_MAX_LENGTH
  );
}

function isValidDescription(description) {
  if (!description || typeof description !== "string") return false;
  const trimmed = description.trim();
  return (
    trimmed.length >= HERO_SLIDE_CONFIG.DESCRIPTION_MIN_LENGTH &&
    trimmed.length <= HERO_SLIDE_CONFIG.DESCRIPTION_MAX_LENGTH
  );
}

function isValidSearchPlaceholder(searchPlaceholder) {
  if (!searchPlaceholder || typeof searchPlaceholder !== "string") return false;
  const trimmed = searchPlaceholder.trim();
  return (
    trimmed.length >= HERO_SLIDE_CONFIG.SEARCH_PLACEHOLDER_MIN_LENGTH &&
    trimmed.length <= HERO_SLIDE_CONFIG.SEARCH_PLACEHOLDER_MAX_LENGTH
  );
}

function assertValidHeroSlideInput({
  role,
  title,
  description,
  searchPlaceholder,
}) {
  if (!isValidRole(role)) {
    throw new ValidationError(
      `Rôle invalide. Valeurs autorisées : ${HERO_SLIDE_CONFIG.ALLOWED_ROLES.join(", ")}.`,
    );
  }
  if (!isValidTitle(title)) {
    throw new ValidationError(
      `Le titre doit contenir entre ${HERO_SLIDE_CONFIG.TITLE_MIN_LENGTH} et ${HERO_SLIDE_CONFIG.TITLE_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidDescription(description)) {
    throw new ValidationError(
      `La description doit contenir entre ${HERO_SLIDE_CONFIG.DESCRIPTION_MIN_LENGTH} et ${HERO_SLIDE_CONFIG.DESCRIPTION_MAX_LENGTH} caractères.`,
    );
  }
  if (!isValidSearchPlaceholder(searchPlaceholder)) {
    throw new ValidationError(
      `Le texte de recherche doit contenir entre ${HERO_SLIDE_CONFIG.SEARCH_PLACEHOLDER_MIN_LENGTH} et ${HERO_SLIDE_CONFIG.SEARCH_PLACEHOLDER_MAX_LENGTH} caractères.`,
    );
  }
}

function assertRoleNotAlreadyUsed(existingSlideForRole, role) {
  if (existingSlideForRole) {
    throw new ConflictError(
      `Un slide hero existe déjà pour le rôle "${role}". Modifiez-le au lieu d'en créer un nouveau.`,
    );
  }
}

function assertProductEligibleForHero(product) {
  if (!product) {
    throw new ValidationError("Produit introuvable pour ce slide hero.");
  }
  if (product.status !== "PUBLISHED") {
    throw new ConflictError(
      "Seul un produit publié peut être mis en avant sur l'écran d'accueil.",
    );
  }
  if (product.shop?.status !== "PUBLISHED" || product.shop?.deletedAt) {
    throw new ConflictError(
      "La boutique de ce produit n'est pas active, il ne peut pas être mis en avant.",
    );
  }
}

function formatHeroSlideForClient(slide) {
  const product = slide.product;
  const defaultVariant =
    product?.variants?.find((v) => v.isDefault) ?? product?.variants?.[0];

  return {
    role:
      HERO_SLIDE_CONFIG.ROLE_TO_CLIENT[slide.role] ?? slide.role.toLowerCase(),
    title: slide.title,
    description: slide.description,
    searchPlaceholder: slide.searchPlaceholder,
    image: slide.imageUrl,
    products: product
      ? [
          {
            slug: product.slug,
            name: product.name,
            images: (product.images ?? []).map((img) => img.url),
            price: defaultVariant ? Number(defaultVariant.price) : null,
            currency: product.currency,
            subtitle: defaultVariant?.name ?? null,
          },
        ]
      : [],
  };
}

module.exports = {
  isValidRole,
  isValidTitle,
  isValidDescription,
  isValidSearchPlaceholder,
  assertValidHeroSlideInput,
  assertRoleNotAlreadyUsed,
  assertProductEligibleForHero,
  formatHeroSlideForClient,
};
