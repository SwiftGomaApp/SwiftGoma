const CATEGORY_CONFIG = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 60,

  DEFAULT_CATEGORIES: [
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
  ],
};

module.exports = { CATEGORY_CONFIG };
