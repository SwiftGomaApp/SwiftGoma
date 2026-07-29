const { ValidationError } = require("../../../common/errors");
const { CATEGORY_CONFIG } = require("../config/category.config");

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function isValidCategoryName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  return (
    trimmed.length >= CATEGORY_CONFIG.NAME_MIN_LENGTH &&
    trimmed.length <= CATEGORY_CONFIG.NAME_MAX_LENGTH
  );
}

function assertValidCategoryInput(input) {
  if (!isValidCategoryName(input.name)) {
    throw new ValidationError(
      `Le nom de la catégorie doit contenir entre ${CATEGORY_CONFIG.NAME_MIN_LENGTH} et ${CATEGORY_CONFIG.NAME_MAX_LENGTH} caractères.`,
    );
  }
}

function assertValidSubcategoryInput(input) {
  if (!isValidCategoryName(input.name)) {
    throw new ValidationError(
      `Le nom de la sous-catégorie doit contenir entre ${CATEGORY_CONFIG.NAME_MIN_LENGTH} et ${CATEGORY_CONFIG.NAME_MAX_LENGTH} caractères.`,
    );
  }
  if (!input.categoryId) {
    throw new ValidationError("Catégorie parente requise.");
  }
}

module.exports = {
  generateSlug,
  isValidCategoryName,
  assertValidCategoryInput,
  assertValidSubcategoryInput,
};
