// lib/mock-categories.ts
// Temporary mock data matching CATEGORY_CONFIG.DEFAULT_CATEGORIES — remove once
// the Header fetches real categories via listCategories().

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RAW_CATEGORIES = [
  {
    name: "Alimentation & Boissons",
    subcategories: [
      "Boissons",
      "Produits secs",
      "Fruits & légumes",
      "Viande, poisson & volaille",
      "Snacks & confiseries",
    ],
  },
  {
    name: "Épicerie / Produits ménagers",
    subcategories: [
      "Produits d'entretien & nettoyage",
      "Hygiène de la maison",
      "Ustensiles & articles de cuisine",
      "Petits équipements ménagers",
    ],
  },
  {
    name: "Beauté & Soins personnels",
    subcategories: [
      "Soins du visage & du corps",
      "Soins capillaires",
      "Maquillage",
      "Parfums",
      "Hygiène personnelle",
    ],
  },
  {
    name: "Mode & Vêtements",
    subcategories: [
      "Vêtements homme",
      "Vêtements femme",
      "Vêtements enfant",
      "Chaussures",
      "Accessoires",
    ],
  },
  {
    name: "Fournitures (meuble)",
    subcategories: [
      "Salon",
      "Chambre à coucher",
      "Cuisine & salle à manger",
      "Bureau",
      "Décoration",
    ],
  },
  {
    name: "Électroniques",
    subcategories: [
      "Téléphones & accessoires",
      "Ordinateurs & accessoires",
      "Audio & TV",
      "Électroménager",
      "Gadgets & accessoires divers",
    ],
  },
];

export const CATEGORIES = RAW_CATEGORIES.map((category, i) => ({
  id: `cat-${i + 1}`,
  name: category.name,
  slug: slugify(category.name),
  sortOrder: i,
  isActive: true,
  subcategories: category.subcategories.map((name, j) => ({
    id: `cat-${i + 1}-sub-${j + 1}`,
    categoryId: `cat-${i + 1}`,
    name,
    slug: slugify(name),
    sortOrder: j,
    isActive: true,
  })),
}));
