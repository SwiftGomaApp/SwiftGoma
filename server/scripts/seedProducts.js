const { getPrismaClient } = require("../src/config/prisma");

const prisma = getPrismaClient();

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const CATEGORIES = [
  {
    id: "aa60f135-7eb3-4769-abea-6f5e7bfd9af6",
    slug: "alimentation-boissons",
    type: "food",
    subcategories: [
      {
        id: "99ef3a49-c82c-489e-bfab-7fbbd70738bd",
        slug: "boissons",
        name: "Boissons",
      },
      {
        id: "fa35bbfe-c327-4972-9ef1-c5c8c28a5ae5",
        slug: "produits-secs",
        name: "Produits secs",
      },
      {
        id: "254893ca-02be-4a33-8bdc-c14191b931bc",
        slug: "fruits-legumes",
        name: "Fruits & légumes",
      },
      {
        id: "95dad6ff-da71-42a3-bc36-ece6c76a3977",
        slug: "viande-poisson-volaille",
        name: "Viande, poisson & volaille",
      },
      {
        id: "120fd5da-ac25-4354-b504-ce12e91f76d0",
        slug: "snacks-confiseries",
        name: "Snacks & confiseries",
      },
    ],
  },
  {
    id: "b4ee9d6a-0936-4fa6-8f77-be5a0ea50b15",
    slug: "epicerie-produits-menagers",
    type: "household",
    subcategories: [
      {
        id: "015fe56e-1b2f-42da-9a67-79d5b8bd633f",
        slug: "produits-d-entretien-nettoyage",
        name: "Produits d'entretien & nettoyage",
      },
      {
        id: "027cde8a-101d-480b-8f82-01282bdd5718",
        slug: "hygiene-de-la-maison",
        name: "Hygiène de la maison",
      },
      {
        id: "f2dd2e9d-ac1a-4ce7-974a-d7981739f466",
        slug: "ustensiles-articles-de-cuisine",
        name: "Ustensiles & articles de cuisine",
      },
      {
        id: "f375e5ba-4a78-49d7-b627-cbed757b55b2",
        slug: "petits-equipements-menagers",
        name: "Petits équipements ménagers",
      },
    ],
  },
  {
    id: "39b1e775-fe34-4d98-a02e-ffbfd25323a0",
    slug: "beaute-soins-personnels",
    type: "beauty",
    subcategories: [
      {
        id: "ca3a07df-25fd-4039-9e74-b3a0f046bce3",
        slug: "soins-du-visage-du-corps",
        name: "Soins du visage & du corps",
      },
      {
        id: "4910ea83-e438-4586-813a-f2def3b4d4ee",
        slug: "soins-capillaires",
        name: "Soins capillaires",
      },
      {
        id: "58a71c33-4efd-4c2b-b2f9-588309d36fa5",
        slug: "maquillage",
        name: "Maquillage",
      },
      {
        id: "78bdd41f-4818-4fd6-9395-ee6d04d13a90",
        slug: "parfums",
        name: "Parfums",
      },
      {
        id: "fc270cd0-1a8c-4cd0-80ef-200ae94b8f4d",
        slug: "hygiene-personnelle",
        name: "Hygiène personnelle",
      },
    ],
  },
  {
    id: "afc93ea0-be05-4c67-8705-7fd11eef612c",
    slug: "mode-vetements",
    type: "clothing",
    subcategories: [
      {
        id: "ac2b3d0c-ced1-4cbb-867c-483745acae56",
        slug: "vetements-homme",
        name: "Vêtements homme",
      },
      {
        id: "2017e720-a529-4eed-917d-c13d6a0c3eaf",
        slug: "vetements-femme",
        name: "Vêtements femme",
      },
      {
        id: "4a12c4d0-f51c-4241-872d-61d356b32bd0",
        slug: "vetements-enfant",
        name: "Vêtements enfant",
      },
      {
        id: "4d90c5ba-5381-4ef3-8b46-82b36d31d065",
        slug: "chaussures",
        name: "Chaussures",
      },
      {
        id: "bd70c5fe-0606-429d-9b7b-b3786df574a0",
        slug: "accessoires",
        name: "Accessoires",
      },
    ],
  },
  {
    id: "25607b6f-0a75-4698-b252-afdc1c3e4cad",
    slug: "fournitures-meuble",
    type: "furniture",
    subcategories: [
      {
        id: "442ad943-8e10-4874-9ac9-5039d999f250",
        slug: "salon",
        name: "Salon",
      },
      {
        id: "50e0d7f8-5c75-4593-a366-1cc13d57ff24",
        slug: "chambre-a-coucher",
        name: "Chambre à coucher",
      },
      {
        id: "6ac2fc17-6476-4343-af09-903622a62ee3",
        slug: "cuisine-salle-a-manger",
        name: "Cuisine & salle à manger",
      },
      {
        id: "6cb1535b-8931-4320-822b-e2ab5952274f",
        slug: "bureau",
        name: "Bureau",
      },
      {
        id: "efdbdb17-27fb-4c14-b4d1-c5d0e398c4c6",
        slug: "decoration",
        name: "Décoration",
      },
    ],
  },
  {
    id: "5c439eec-ed29-43b9-931f-92400da30adf",
    slug: "electroniques",
    type: "electronics",
    subcategories: [
      {
        id: "ea310860-cb3f-439e-b80c-2d3d50813aa6",
        slug: "telephones-accessoires",
        name: "Téléphones & accessoires",
      },
      {
        id: "45b49636-9ccf-4cad-80e4-be93f5e62f65",
        slug: "ordinateurs-accessoires",
        name: "Ordinateurs & accessoires",
      },
      {
        id: "17801808-52e6-4cf5-adbd-1451af8b2ce1",
        slug: "audio-tv",
        name: "Audio & TV",
      },
      {
        id: "fe0ca0af-f484-4af0-9ebf-e6aaf01691d4",
        slug: "electromenager",
        name: "Électroménager",
      },
      {
        id: "a51fa67d-d98c-476b-8b33-cb427562e3d0",
        slug: "gadgets-accessoires-divers",
        name: "Gadgets & accessoires divers",
      },
    ],
  },
];

// ============================================================
// Product names — 5 per subcategory, matched to the actual theme
// ============================================================

const PRODUCT_NAMES = {
  boissons: [
    "Eau minérale 1.5L",
    "Jus de fruits tropical",
    "Soda citron-gingembre",
    "Café moulu 250g",
    "Thé glacé pêche",
  ],
  "produits-secs": [
    "Riz parfumé 5kg",
    "Farine de maïs 2kg",
    "Haricots secs 1kg",
    "Pâtes spaghetti 500g",
    "Sucre en poudre 1kg",
  ],
  "fruits-legumes": [
    "Tomates fraîches 1kg",
    "Bananes plantain",
    "Avocats mûrs (x4)",
    "Oignons rouges 1kg",
    "Choux frais",
  ],
  "viande-poisson-volaille": [
    "Poulet entier fermier",
    "Filet de tilapia frais",
    "Bœuf haché 500g",
    "Sardines fraîches (x6)",
    "Cuisses de poulet (x4)",
  ],
  "snacks-confiseries": [
    "Chips de plantain",
    "Biscuits sablés",
    "Barres de chocolat (x3)",
    "Cacahuètes grillées 200g",
    "Bonbons assortis",
  ],

  "produits-d-entretien-nettoyage": [
    "Liquide vaisselle 750ml",
    "Détergent à lessive 2kg",
    "Nettoyant multi-surfaces",
    "Eau de javel 1L",
    "Éponges de nettoyage (x5)",
  ],
  "hygiene-de-la-maison": [
    "Papier toilette (x8)",
    "Sacs poubelle 50L (x20)",
    "Essuie-tout (x4)",
    "Désinfectant pour sols",
    "Gants de ménage",
  ],
  "ustensiles-articles-de-cuisine": [
    "Set de casseroles inox",
    "Planche à découper bois",
    "Couteaux de cuisine (x3)",
    "Passoire inox",
    "Set de spatules",
  ],
  "petits-equipements-menagers": [
    "Bouilloire électrique",
    "Grille-pain 2 fentes",
    "Balance de cuisine",
    "Mixeur plongeant",
    "Fer à repasser",
  ],

  "soins-du-visage-du-corps": [
    "Crème hydratante visage",
    "Lait corporel karité",
    "Gommage exfoliant",
    "Sérum vitamine C",
    "Savon noir africain",
  ],
  "soins-capillaires": [
    "Shampooing nourrissant",
    "Huile capillaire ricin",
    "Après-shampooing réparateur",
    "Crème coiffante",
    "Masque capillaire profond",
  ],
  maquillage: [
    "Rouge à lèvres mat",
    "Fond de teint fluide",
    "Mascara volumateur",
    "Palette fards à paupières",
    "Crayon sourcils",
  ],
  parfums: [
    "Parfum homme boisé",
    "Eau de toilette femme fleurie",
    "Déodorant spray",
    "Coffret parfum duo",
    "Brume corporelle",
  ],
  "hygiene-personnelle": [
    "Gel douche 500ml",
    "Dentifrice blancheur",
    "Brosse à dents (x2)",
    "Rasoirs jetables (x5)",
    "Coton-tiges (x100)",
  ],

  "vetements-homme": [
    "T-shirt col rond",
    "Chemise à manches longues",
    "Jean coupe droite",
    "Pantalon chino",
    "Polo classique",
  ],
  "vetements-femme": [
    "Robe légère été",
    "Chemisier fluide",
    "Jupe plissée",
    "Pantalon taille haute",
    "Top col en V",
  ],
  "vetements-enfant": [
    "T-shirt imprimé enfant",
    "Robe fillette",
    "Short garçon",
    "Pyjama enfant",
    "Veste légère enfant",
  ],
  chaussures: [
    "Baskets running",
    "Sandales cuir",
    "Chaussures de ville",
    "Bottines femme",
    "Tongs plage",
  ],
  accessoires: [
    "Ceinture cuir",
    "Casquette ajustable",
    "Sac à main",
    "Montre bracelet",
    "Écharpe en laine",
  ],

  salon: [
    "Canapé 3 places",
    "Table basse bois",
    "Fauteuil relax",
    "Étagère murale",
    "Tapis de salon",
  ],
  "chambre-a-coucher": [
    "Lit double avec sommier",
    "Armoire 2 portes",
    "Table de chevet",
    "Matelas mémoire de forme",
    "Commode 4 tiroirs",
  ],
  "cuisine-salle-a-manger": [
    "Table à manger 6 places",
    "Chaises de salle à manger (x4)",
    "Buffet de rangement",
    "Table haute bar",
    "Tabourets de cuisine (x2)",
  ],
  bureau: [
    "Bureau d'ordinateur",
    "Chaise de bureau ergonomique",
    "Étagère de rangement bureau",
    "Lampe de bureau LED",
    "Meuble classeur",
  ],
  decoration: [
    "Miroir mural décoratif",
    "Vase en céramique",
    "Cadre photo (x3)",
    "Coussins décoratifs (x2)",
    "Bougies parfumées (x3)",
  ],

  "telephones-accessoires": [
    "Smartphone Android 128GB",
    "Coque de protection téléphone",
    "Chargeur rapide USB-C",
    "Écouteurs sans fil",
    "Support téléphone voiture",
  ],
  "ordinateurs-accessoires": [
    'Ordinateur portable 15"',
    "Souris sans fil",
    "Clavier USB",
    "Disque dur externe 1To",
    "Sac pour ordinateur portable",
  ],
  "audio-tv": [
    "Enceinte Bluetooth portable",
    "Casque audio sans fil",
    'Télévision LED 43"',
    "Barre de son",
    "Câble HDMI 2m",
  ],
  electromenager: [
    "Mixeur électrique",
    "Machine à café",
    "Fer à repasser vapeur",
    "Ventilateur de table",
    "Bouilloire électrique inox",
  ],
  "gadgets-accessoires-divers": [
    "Powerbank 10000mAh",
    "Montre connectée",
    "Lampe torche rechargeable",
    "Câble USB multi-connecteurs",
    "Adaptateur secteur universel",
  ],
};

// ============================================================
// Image pools — themed per category, cycled across its subcategories
// ============================================================

const CATEGORY_IMAGES = {
  food: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
    "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=800&q=80",
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?w=800&q=80",
    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80",
    "https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80",
    "https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=800&q=80",
  ],
  household: [
    "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&q=80",
    "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80",
    "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=800&q=80",
    "https://images.unsplash.com/photo-1610557892470-55d587c9e37c?w=800&q=80",
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
  ],
  beauty: [
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    "https://images.unsplash.com/photo-1631730359585-38a4935cbec4?w=800&q=80",
    "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80",
    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
  ],
  clothing: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80",
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
  ],
  furniture: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    "https://images.unsplash.com/photo-1617104678098-de229db51175?w=800&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80",
    "https://images.unsplash.com/photo-1524758870432-af57e54afa26?w=800&q=80",
  ],
  electronics: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80",
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80",
  ],
};

// ============================================================
// Variant generators — one per category "type", so the product
// structure actually matches what that kind of item needs.
// Whole-number prices only (no cents).
// ============================================================

function priceFor(type, index) {
  const ranges = {
    food: [1.5, 12],
    household: [2, 20],
    beauty: [4, 35],
    clothing: [8, 45],
    furniture: [30, 350],
    electronics: [10, 800],
  };
  const [min, max] = ranges[type];
  const spread = max - min;
  return Math.round(min + (spread * (index % 5)) / 4);
}

function makeVariants(type, index) {
  const base = priceFor(type, index);
  // Give roughly 1-in-4 products zero stock, for empty/out-of-stock UI states.
  const outOfStock = index % 7 === 3;

  switch (type) {
    case "clothing": {
      const sizes = ["S", "M", "L", "XL"];
      return sizes.map((size, i) => ({
        name: size,
        attributes: { size },
        price: base,
        stock: outOfStock ? 0 : 5 + i * 3,
      }));
    }
    case "electronics": {
      // Phones/computers-style items get 2 storage variants; simpler
      // gadgets get 1. Alternate based on index for variety.
      if (index % 2 === 0) {
        return [
          {
            name: "64GB",
            attributes: { storage: "64GB" },
            price: base,
            stock: outOfStock ? 0 : 8,
          },
          {
            name: "128GB",
            attributes: { storage: "128GB" },
            price: Math.round(base * 1.25),
            stock: outOfStock ? 0 : 5,
          },
        ];
      }
      return [{ price: base, stock: outOfStock ? 0 : 12, isDefault: true }];
    }
    case "beauty": {
      const sizes = ["50ml", "100ml"];
      return sizes.map((size, i) => ({
        name: size,
        attributes: { volume: size },
        price: Math.round(base + i * base * 0.6),
        stock: outOfStock ? 0 : 10 - i * 3,
      }));
    }
    case "food": {
      // Single variant, weight/size encoded in the product name already.
      return [{ price: base, stock: outOfStock ? 0 : 30, isDefault: true }];
    }
    case "furniture": {
      return [{ price: base, stock: outOfStock ? 0 : 4, isDefault: true }];
    }
    case "household":
    default: {
      return [{ price: base, stock: outOfStock ? 0 : 20, isDefault: true }];
    }
  }
}

function makeDescription(categoryType, subcategoryName, productName) {
  const templates = {
    food: `${productName} — produit frais, sélectionné avec soin, catégorie ${subcategoryName}.`,
    household: `${productName} pour l'entretien du quotidien, efficace et pratique.`,
    beauty: `${productName} — soin de qualité pour prendre soin de vous chaque jour.`,
    clothing: `${productName}, coupe confortable, tissu de qualité, disponible en plusieurs tailles.`,
    furniture: `${productName} — pièce robuste et élégante pour aménager votre intérieur.`,
    electronics: `${productName} — performant et fiable, garanti pour un usage quotidien.`,
  };
  return templates[categoryType];
}

// ============================================================
// Seed
// ============================================================

async function main() {
  const shopIdArg = process.argv[2];

  const shop = shopIdArg
    ? await prisma.shop.findUnique({ where: { id: shopIdArg } })
    : await prisma.shop.findFirst();

  if (!shop) {
    throw new Error(
      shopIdArg
        ? `No shop found with id "${shopIdArg}"`
        : "No shop found in the database — create one first.",
    );
  }

  console.log(`Seeding into shop: ${shop.name} (${shop.id})\n`);

  let created = 0;
  let globalIndex = 0;

  for (const category of CATEGORIES) {
    const images = CATEGORY_IMAGES[category.type];

    for (const sub of category.subcategories) {
      const names = PRODUCT_NAMES[sub.slug];
      if (!names) {
        console.warn(
          `  ⚠ No product names defined for subcategory "${sub.slug}" — skipping.`,
        );
        continue;
      }

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const baseSlug = generateSlug(name);
        let slug = baseSlug;
        let counter = 1;
        while (await prisma.product.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`;
          counter += 1;
        }

        const variants = makeVariants(category.type, globalIndex);
        const hasVariants = variants.length > 1;
        // Ensure exactly one isDefault when there are multiple variants.
        if (hasVariants) {
          variants.forEach((v, vi) => {
            v.isDefault = vi === 0;
          });
        }

        // 1-3 images per product, cycling through the category's pool.
        const imageCount = 1 + (globalIndex % 3);
        const productImages = Array.from(
          { length: imageCount },
          (_, pos) => images[(globalIndex + pos) % images.length],
        );

        await prisma.product.create({
          data: {
            shopId: shop.id,
            subcategoryId: sub.id,
            name,
            slug,
            description: makeDescription(category.type, sub.name, name),
            brand: null,
            unit: category.type === "food" ? "kg" : "piece",
            weightGrams:
              category.type === "food" ? 500 + (globalIndex % 5) * 200 : null,
            expiresAt:
              sub.slug === "fruits-legumes" ||
              sub.slug === "viande-poisson-volaille"
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                : null,
            currency: "USD",
            status: "PUBLISHED",
            hasVariants,
            images: {
              create: productImages.map((url, position) => ({
                url,
                publicId: `seed-${slug}-${position}`,
                position,
              })),
            },
            variants: { create: variants },
          },
        });

        created += 1;
        globalIndex += 1;
        console.log(
          `  ✓ [${category.slug}/${sub.slug}] ${name} (${variants.length} variant${variants.length > 1 ? "s" : ""})`,
        );
      }
    }
  }

  console.log(
    `\nDone — created ${created} products across ${CATEGORIES.length} categories.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
