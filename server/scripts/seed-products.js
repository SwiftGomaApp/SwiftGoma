const { getPrismaClient } = require("../src/config/prisma");

const prisma = getPrismaClient();

const SHOP_ID = "376b3f98-a182-4160-9377-ad4df11e00dc";

const SUBCATEGORIES = [
  // Alimentation & Boissons
  {
    id: "153fab05-cdec-4603-b77c-d5d85e494da3",
    name: "Boissons",
    isFood: true,
  },
  {
    id: "491c0b93-1811-44f7-a26a-9e1f6d5aa9d7",
    name: "Produits secs",
    isFood: true,
  },
  {
    id: "33fc4062-18d0-4ee0-b426-3bc475464950",
    name: "Fruits & légumes",
    isFood: true,
  },
  {
    id: "9e4bc7a1-2c4c-4572-bac5-88763e5748a9",
    name: "Viande, poisson & volaille",
    isFood: true,
  },
  {
    id: "6504265d-2210-4dda-b5cf-3b134c52e380",
    name: "Snacks & confiseries",
    isFood: true,
  },

  // Épicerie / Produits ménagers
  {
    id: "a6cb0eb6-b129-4881-8152-3e34d9ef229d",
    name: "Produits d'entretien & nettoyage",
    isFood: false,
  },
  {
    id: "255e495d-18f5-43ce-9304-53e54b066f15",
    name: "Hygiène de la maison",
    isFood: false,
  },
  {
    id: "ed33e11c-e4a4-45c4-9cb2-835ee4513200",
    name: "Ustensiles & articles de cuisine",
    isFood: false,
  },
  {
    id: "2d0c1535-6cd1-47ca-9a49-5ab1d4ea77aa",
    name: "Petits équipements ménagers",
    isFood: false,
  },

  // Beauté & Soins personnels
  {
    id: "c2f16357-c589-4277-82a2-2261283ee0fa",
    name: "Soins du visage & du corps",
    isFood: false,
  },
  {
    id: "164cc924-7b48-4798-b5a2-b4916d17e6fe",
    name: "Soins capillaires",
    isFood: false,
  },
  {
    id: "ba2157f5-2135-4653-9331-9e892d2db98f",
    name: "Maquillage",
    isFood: false,
  },
  {
    id: "ba6217e5-ae36-4f12-8690-09e817f8328f",
    name: "Parfums",
    isFood: false,
  },
  {
    id: "8c8d2188-eaf4-4add-b576-ffab2b8f1b5f",
    name: "Hygiène personnelle",
    isFood: false,
  },

  // Mode & Vêtements
  {
    id: "2516b292-47e8-43e7-a95c-5f8432552444",
    name: "Vêtements homme",
    isFood: false,
  },
  {
    id: "82640928-022d-4d5c-9f40-fbaadb9e644f",
    name: "Vêtements femme",
    isFood: false,
  },
  {
    id: "7e8977c7-135b-403f-9418-f4dd9e5e4202",
    name: "Vêtements enfant",
    isFood: false,
  },
  {
    id: "0f52a5c3-ce68-4d02-bc7f-7d33fdc6433d",
    name: "Chaussures",
    isFood: false,
  },
  {
    id: "39fc79cb-689f-4995-83bb-be42d6feb6a4",
    name: "Accessoires",
    isFood: false,
  },

  // Fournitures (meuble)
  { id: "c62b7d61-02e0-4d52-b9d3-a952f8c204fa", name: "Salon", isFood: false },
  {
    id: "bd0e0249-4834-4c1f-bd49-6eeef6e41ddb",
    name: "Chambre à coucher",
    isFood: false,
  },
  {
    id: "0254b614-e92d-4c23-be2c-42314947b9a5",
    name: "Cuisine & salle à manger",
    isFood: false,
  },
  { id: "3f8a2675-b3a2-419b-a41b-c897e318b9d4", name: "Bureau", isFood: false },
  {
    id: "81c21020-8f12-46df-9dfd-6014b90e25cd",
    name: "Décoration",
    isFood: false,
  },

  // Électroniques
  {
    id: "e6ffbdf0-0dea-44ed-9c87-ff73ac036a35",
    name: "Téléphones & accessoires",
    isFood: false,
  },
  {
    id: "39ef981a-2d67-4123-b884-5e6bb9143395",
    name: "Ordinateurs & accessoires",
    isFood: false,
  },
  {
    id: "f953b1c9-d12b-47ee-a8a9-8961e72f2501",
    name: "Audio & TV",
    isFood: false,
  },
  {
    id: "fcbe0f45-13ee-40c3-a9ce-feac9e83cf7f",
    name: "Électroménager",
    isFood: false,
  },
  {
    id: "acba8d1e-5ac9-49a2-b865-fba3ffd9870f",
    name: "Gadgets & accessoires divers",
    isFood: false,
  },
];

// Helper to generate slugs
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Raw product data specifically tailored to North Kivu / Goma commerce
const PRODUCTS_DATA = {
  // 1. Boissons
  "153fab05-cdec-4603-b77c-d5d85e494da3": [
    {
      name: "Jus de Fruit Vitalo Ananas",
      brand: "Vitalo",
      unit: "bouteille",
      weightGrams: 500,
      description:
        "Jus d'ananas rafraîchissant produit en RDC, parfait pour la chaleur de Goma.",
      images: [
        "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "500ml Pack de 1", price: 1.5, stock: 50, sku: "VIT-ANA-500" },
        {
          name: "500ml Carton (12 pcs)",
          price: 15.0,
          stock: 20,
          sku: "VIT-ANA-CRT",
        },
      ],
    },
    {
      name: "Eau Minérale Superb 1.5L",
      brand: "Superb",
      unit: "bouteille",
      weightGrams: 1500,
      description: "Eau minérale pure embouteillée localement au Kivu.",
      images: [
        "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "1.5L Unité", price: 0.8, stock: 100, sku: "SUP-WAT-15" },
        { name: "Pack de 6", price: 4.0, stock: 40, sku: "SUP-WAT-PK6" },
      ],
    },
    {
      name: "Biere Primus RDC 72cl",
      brand: "Bralima",
      unit: "bouteille",
      weightGrams: 720,
      description: "La grande bière nationale du Congo, brassée avec soin.",
      images: [
        "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille 72cl", price: 2.0, stock: 60, sku: "BRA-PRI-72" },
        { name: "Casier de 12", price: 22.0, stock: 15, sku: "BRA-PRI-CAS" },
      ],
    },
    {
      name: "Café Arabica du Kivu Moulu",
      brand: "Kivu Coffee",
      unit: "sachet",
      weightGrams: 250,
      description:
        "Café pur Arabica cultivé sur les terroirs volcaniques du Nord-Kivu.",
      images: [
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "250g Moulu", price: 4.5, stock: 35, sku: "KIV-CAF-250M" },
        { name: "500g En Grain", price: 8.5, stock: 20, sku: "KIV-CAF-500G" },
      ],
    },
    {
      name: "Lait Concentré Sucré Peak 397g",
      brand: "Peak",
      unit: "boite",
      weightGrams: 397,
      description:
        "Lait concentré sucré idéal pour les petits déjeuners et le thé.",
      images: [
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Boîte 397g", price: 2.2, stock: 80, sku: "PEA-LCT-397" },
      ],
    },
    {
      name: "Thé Noir de Rutshuru",
      brand: "Virunga Tea",
      unit: "boite",
      weightGrams: 100,
      description:
        "Thé noir intense et aromatique récolté à la main près de Rutshuru.",
      images: [
        "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563822249510-04678c7833f9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Boîte 25 sachets", price: 1.8, stock: 45, sku: "VIR-THE-25" },
      ],
    },
  ],

  // 2. Produits secs
  "491c0b93-1811-44f7-a26a-9e1f6d5aa9d7": [
    {
      name: "Farine de Maïs Semoule (Sanza)",
      brand: "Local Kivu",
      unit: "sac",
      weightGrams: 5000,
      description:
        "Farine de maïs de qualité supérieure pour préparation du Foufou à Goma.",
      images: [
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1627485937980-221c88ab04f9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sac 5kg", price: 4.5, stock: 40, sku: "FAR-MAI-05K" },
        { name: "Sac 25kg", price: 21.0, stock: 15, sku: "FAR-MAI-25K" },
      ],
    },
    {
      name: "Riz Parfumé Super Basmati",
      brand: "Congo Rice",
      unit: "sac",
      weightGrams: 5000,
      description: "Riz blanc long grain parfumé, cuisson facile et rapide.",
      images: [
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613758235210-918804c21966?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sac 5kg", price: 6.0, stock: 30, sku: "RIZ-PAR-05K" },
        { name: "Sac 25kg", price: 28.0, stock: 10, sku: "RIZ-PAR-25K" },
      ],
    },
    {
      name: "Haricots Rouges du Kivu (Makarani)",
      brand: "Marche Virunga",
      unit: "kg",
      weightGrams: 1000,
      description:
        "Haricots rouges locaux très tendres et riches en protéines.",
      images: [
        "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "1kg Sachet", price: 1.5, stock: 100, sku: "HAR-ROU-01K" },
        { name: "5kg Sachet", price: 7.0, stock: 25, sku: "HAR-ROU-05K" },
      ],
    },
    {
      name: "Farine de Manioc Purified",
      brand: "Goma Bio",
      unit: "sac",
      weightGrams: 5000,
      description:
        "Farine de manioc extra blanche et affinée pour Foufou traditionnel.",
      images: [
        "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sac 5kg", price: 3.8, stock: 50, sku: "FAR-MAN-05K" },
      ],
    },
    {
      name: "Huile de Palme Rouge Pure",
      brand: "Maniema Gold",
      unit: "bidon",
      weightGrams: 2000,
      description:
        "Huile de palme artisanale purifiée non raffinée, idéale pour Sambaza.",
      images: [
        "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bidon 2L", price: 3.5, stock: 30, sku: "HUI-PAL-02L" },
        { name: "Bidon 5L", price: 8.0, stock: 15, sku: "HUI-PAL-05L" },
      ],
    },
    {
      name: "Spaghetti Panzani 500g",
      brand: "Panzani",
      unit: "paquet",
      weightGrams: 500,
      description: "Pâtes alimentaires de qualité supérieure.",
      images: [
        "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621996346565-e3def6164299?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598866594230-a7c12756260f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Paquet 500g", price: 1.2, stock: 120, sku: "PAN-SPA-500" },
      ],
    },
  ],

  // 3. Fruits & légumes
  "33fc4062-18d0-4ee0-b426-3bc475464950": [
    {
      name: "Bananes Plantains Fraîches (Makemba)",
      brand: "Ferme Sake",
      unit: "regime",
      weightGrams: 10000,
      description:
        "Régime de bananes plantains mûres en provenance des plantations de Masisi.",
      images: [
        "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Demi-Régime (~5kg)",
          price: 3.5,
          stock: 15,
          sku: "BAN-PLA-DEM",
        },
        {
          name: "Grand Régime (~10kg)",
          price: 6.5,
          stock: 10,
          sku: "BAN-PLA-GRD",
        },
      ],
    },
    {
      name: "Pommes de Terre de Rutshuru",
      brand: "Ferme Rutshuru",
      unit: "sac",
      weightGrams: 10000,
      description:
        "Pommes de terre fraîches d'altitude idéales pour frites ou ragoût.",
      images: [
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508313880080-c4bef0730395?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590165482129-1b8b27698780?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sac 10kg", price: 5.0, stock: 25, sku: "POM-TER-10K" },
      ],
    },
    {
      name: "Avocats Géants de Masisi",
      brand: "Masisi Organics",
      unit: "piece",
      weightGrams: 400,
      description:
        "Avocats très crémeux et biologiques cultivés dans les collines du Kivu.",
      images: [
        "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519162584292-56dfc9eb5db4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Filet de 5 pièces",
          price: 2.0,
          stock: 40,
          sku: "AVO-MAS-FL5",
        },
      ],
    },
    {
      name: "Feuilles de Manioc Fraîches (Sombe)",
      brand: "Marche Virunga",
      unit: "botte",
      weightGrams: 1000,
      description:
        "Bottes de feuilles de manioc fraîches triées pour la cuisson du Sombe.",
      images: [
        "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515471209610-e3f1506577a0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Botte 1kg", price: 1.0, stock: 30, sku: "SOM-MAN-01K" },
      ],
    },
    {
      name: "Tomates Fraîches de Kirotshe",
      brand: "Marché Birere",
      unit: "panier",
      weightGrams: 2000,
      description:
        "Tomates fermes et juteuses récoltées sur le littoral du lac Kivu.",
      images: [
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Panier 2kg", price: 2.5, stock: 20, sku: "TOM-KIR-02K" },
      ],
    },
    {
      name: "Oignons Rouges du Pays",
      brand: "Kivu Agribusiness",
      unit: "filet",
      weightGrams: 3000,
      description: "Oignons rouges bien secs à longue conservation.",
      images: [
        "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580145032338-3f57be777875?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Filet 3kg", price: 3.0, stock: 35, sku: "OIG-ROU-03K" },
      ],
    },
  ],

  // 4. Viande, poisson & volaille
  "9e4bc7a1-2c4c-4572-bac5-88763e5748a9": [
    {
      name: "Poissons Sambaza Frais du Lac Kivu",
      brand: "Pêcheurs Lac Kivu",
      unit: "kg",
      weightGrams: 1000,
      description:
        "Petits poissons frais de nuit pêchés dans le lac Kivu à Goma.",
      images: [
        "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "1kg Frais", price: 4.0, stock: 20, sku: "SAM-KIV-01K" },
        { name: "1kg Séché", price: 6.5, stock: 15, sku: "SAM-KIV-SEC" },
      ],
    },
    {
      name: "Viande de Bœuf Fraîche (Masisi)",
      brand: "Boucherie du Marché",
      unit: "kg",
      weightGrams: 1000,
      description:
        "Bœuf élevé dans les pâturages verts de Masisi, découpe fraîche du jour.",
      images: [
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "1kg Sans os", price: 6.0, stock: 25, sku: "BOE-MAS-SOS" },
        { name: "1kg Avec os", price: 5.0, stock: 30, sku: "BOE-MAS-AOS" },
      ],
    },
    {
      name: "Poulet Entier Nettoyé Surgelé",
      brand: "Goma Cold Storage",
      unit: "piece",
      weightGrams: 1200,
      description: "Poulet prêt à cuire, idéal pour les grillades et sauces.",
      images: [
        "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1615557960916-5f4791effe9d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Poulet 1.2kg", price: 5.5, stock: 40, sku: "POU-SUR-120" },
      ],
    },
    {
      name: "Capitaine du Lac Tanganyika Fumé",
      brand: "Pêche du Congo",
      unit: "piece",
      weightGrams: 800,
      description:
        "Poisson Capitaine fumé traditionnellement, goût très prononcé.",
      images: [
        "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1510130387422-82ebd39b1046?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Unité ~800g", price: 9.0, stock: 12, sku: "CAP-FUM-800" },
      ],
    },
    {
      name: "Viande de Chèvre (Mbuzi)",
      brand: "Boucherie Virunga",
      unit: "kg",
      weightGrams: 1000,
      description:
        "Viande de chèvre tendre pour vos méchouis et ragoûts épicés.",
      images: [
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "1kg Découpé", price: 7.5, stock: 18, sku: "CHE-MBU-01K" },
      ],
    },
    {
      name: "Cuisse de Dindon Surgelée",
      brand: "Import Import",
      unit: "kg",
      weightGrams: 1000,
      description: "Cuisses de dindon bien charnues pour vos repas de fête.",
      images: [
        "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514944298341-9880e65a852d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Carton de 5kg", price: 18.0, stock: 10, sku: "DIN-CUI-05K" },
      ],
    },
  ],

  // 5. Snacks & confiseries
  "6504265d-2210-4dda-b5cf-3b134c52e380": [
    {
      name: "Biscuits Glucose Super",
      brand: "Biskrem",
      unit: "paquet",
      weightGrams: 100,
      description:
        "Biscuits énergétiques croquants très populaires auprès des enfants.",
      images: [
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Unité 100g", price: 0.3, stock: 200, sku: "BIS-GLU-100" },
        { name: "Pack de 24", price: 6.0, stock: 20, sku: "BIS-GLU-PK24" },
      ],
    },
    {
      name: "Chocolat Elvan Toffix",
      brand: "Elvan",
      unit: "sachet",
      weightGrams: 500,
      description: "Bonbons mous fourrés au jus de fruit naturel.",
      images: [
        "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1526080676457-4544bf0eb79f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sachet 500g", price: 3.0, stock: 45, sku: "TOF-ELV-500" },
      ],
    },
    {
      name: "Chips de Banane Plantain (Makemba Crisp)",
      brand: "Goma Delice",
      unit: "sachet",
      weightGrams: 150,
      description:
        "Rondelles de banane plantain croustillantes salées ou pimentées.",
      images: [
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "150g Salé", price: 1.0, stock: 60, sku: "CHI-BAN-SAL" },
        { name: "150g Pimenté", price: 1.0, stock: 60, sku: "CHI-BAN-PIM" },
      ],
    },
    {
      name: "Arachides Grillées de Mahagi",
      brand: "Kivu Nuts",
      unit: "bouteille",
      weightGrams: 300,
      description:
        "Arachides bien dorées et croustillantes emballées sous vide.",
      images: [
        "https://images.unsplash.com/photo-1567892999348-6001083e9b11?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1536591375315-1988168b7832?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille 300g", price: 1.5, stock: 50, sku: "ARA-GRI-300" },
      ],
    },
    {
      name: "Chocolat Noir Lait Milka",
      brand: "Milka",
      unit: "piece",
      weightGrams: 100,
      description: "Tablette de chocolat alpin délicieusement fondant.",
      images: [
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Tablette 100g", price: 2.0, stock: 30, sku: "CHO-MIL-100" },
      ],
    },
    {
      name: "Chewing Gum Orbit Menthe",
      brand: "Orbit",
      unit: "boite",
      weightGrams: 30,
      description: "Dragées de chewing-gum sans sucre fraîcheur intense.",
      images: [
        "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Paquet de 10 dragées",
          price: 0.5,
          stock: 150,
          sku: "CHE-ORB-MEN",
        },
      ],
    },
  ],

  // 6. Produits d'entretien & nettoyage
  "a6cb0eb6-b129-4881-8152-3e34d9ef229d": [
    {
      name: "Savon en Poudre Omo Multi-Action",
      brand: "Omo",
      unit: "sachet",
      weightGrams: 500,
      description:
        "Détergent puissant pour enlever les taches tenaces sur tout type de linge.",
      images: [
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Sachet 500g", price: 1.8, stock: 80, sku: "OMO-POU-500" },
        { name: "Sachet 1kg", price: 3.2, stock: 40, sku: "OMO-POU-01K" },
      ],
    },
    {
      name: "Eau de Javel Lacroix 1L",
      brand: "Lacroix",
      unit: "bouteille",
      weightGrams: 1000,
      description:
        "Désinfecte, nettoie et blanchit parfaitement les surfaces et le linge.",
      images: [
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille 1L", price: 1.5, stock: 60, sku: "JAV-LAC-01L" },
      ],
    },
    {
      name: "Savon de Marseille Local (Le Coq)",
      brand: "Marseille Kivu",
      unit: "barre",
      weightGrams: 400,
      description:
        "Barre de savon brun traditionnel pour la lessive quotidienne.",
      images: [
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Barre 400g", price: 0.8, stock: 150, sku: "SAV-MAR-400" },
      ],
    },
    {
      name: "Liquide Vaisselle Axion Citron 500ml",
      brand: "Axion",
      unit: "bouteille",
      weightGrams: 500,
      description:
        "Nettoyant vaisselle ultra dégraissant au parfum citron rafraîchissant.",
      images: [
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille 500ml", price: 2.0, stock: 55, sku: "AXI-VAI-500" },
      ],
    },
    {
      name: "Nettoyant Sol Ajax Bise Sauvage",
      brand: "Ajax",
      unit: "bouteille",
      weightGrams: 1000,
      description: "Nettoie sans rincer et laisse un parfum agréable qui dure.",
      images: [
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille 1L", price: 3.5, stock: 30, sku: "AJA-SOL-01L" },
      ],
    },
    {
      name: "Éponges Métalliques Spirale",
      brand: "CleanPro",
      unit: "paquet",
      weightGrams: 50,
      description:
        "Éponges en inox pour récurer les casseroles sans les abîmer.",
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pack de 3 éponges",
          price: 1.0,
          stock: 100,
          sku: "EPO-MET-PK3",
        },
      ],
    },
  ],

  // 7. Hygiène de la maison
  "255e495d-18f5-43ce-9304-53e54b066f15": [
    {
      name: "Désinfectant Insecticide Baygon",
      brand: "Baygon",
      unit: "spray",
      weightGrams: 300,
      description:
        "Élimine rapidement les moustiques et insectes volants dans la maison.",
      images: [
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Aérosol 300ml", price: 4.5, stock: 40, sku: "BAY-INS-300" },
      ],
    },
    {
      name: "Désodorisant d'Intérieur Air Wick",
      brand: "Air Wick",
      unit: "spray",
      weightGrams: 250,
      description:
        "Parfum lavande apaisant pour éliminer les mauvaises odeurs.",
      images: [
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Aérosol 250ml", price: 3.0, stock: 35, sku: "AIR-DES-250" },
      ],
    },
    {
      name: "Papier Toilette Rose White 12 Rouleaux",
      brand: "Rose White",
      unit: "paquet",
      weightGrams: 800,
      description: "Papier hygiénique double épaisseur très doux.",
      images: [
        "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Paquet 12 Rouleaux",
          price: 5.0,
          stock: 50,
          sku: "PAP-HYG-12R",
        },
      ],
    },
    {
      name: "Sacs Poubelle Épais 50L",
      brand: "CleanHome",
      unit: "rouleau",
      weightGrams: 200,
      description: "Sacs poubelle noirs résistants aux déchirures.",
      images: [
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Rouleau de 10 sacs",
          price: 2.0,
          stock: 60,
          sku: "SAC-POU-50L",
        },
      ],
    },
    {
      name: "Serpillière Microfibre Épaisse",
      brand: "TexClean",
      unit: "piece",
      weightGrams: 150,
      description: "Absorbe l'eau efficacement et sèche rapidement.",
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Unité Large", price: 2.5, stock: 75, sku: "SER-MIC-LRG" },
      ],
    },
    {
      name: "Moustiquaire Imprégnée 2 Places",
      brand: "Protection Virunga",
      unit: "piece",
      weightGrams: 600,
      description: "Moustiquaire de lit haute protection contre le paludisme.",
      images: [
        "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Format XXL 200x180cm",
          price: 8.0,
          stock: 30,
          sku: "MOU-IMP-XXL",
        },
      ],
    },
  ],

  // 8. Ustensiles & articles de cuisine
  "ed33e11c-e4a4-45c4-9cb2-835ee4513200": [
    {
      name: "Casserole en Aluminium Épais Set de 3",
      brand: "ChefCook",
      unit: "ensemble",
      weightGrams: 2500,
      description:
        "Set de 3 casseroles résistantes parfaites pour cuisson au charbon ou gaz.",
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Set de 3 pièces", price: 18.0, stock: 15, sku: "CAS-ALU-ST3" },
      ],
    },
    {
      name: "Poêle Antiadhésive Tefal 28cm",
      brand: "Tefal",
      unit: "piece",
      weightGrams: 800,
      description:
        "Poêle en revêtement telfon idéale pour frire poisson et bananes.",
      images: [
        "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Diamètre 28cm", price: 14.0, stock: 20, sku: "POE-TEF-28C" },
      ],
    },
    {
      name: "Thermos à Café 1.9L Stainless Steel",
      brand: "Elephant",
      unit: "piece",
      weightGrams: 1100,
      description:
        "Garde l'eau chaude pendant 24 heures sans perte de chaleur.",
      images: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Capacité 1.9L", price: 16.0, stock: 25, sku: "THE-INO-19L" },
      ],
    },
    {
      name: "Couteaux de Cuisine Inox Set de 5",
      brand: "KitchenKing",
      unit: "ensemble",
      weightGrams: 600,
      description: "Couteaux très aiguisés avec manche ergonomique.",
      images: [
        "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Set 5 Couteaux", price: 9.5, stock: 30, sku: "COU-INO-ST5" },
      ],
    },
    {
      name: "Planche à Découper en Bois Mukive",
      brand: "Artisan Kivu",
      unit: "piece",
      weightGrams: 1200,
      description:
        "Planche en bois massif d'ébénisterie locale très résistant.",
      images: [
        "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Format 40x25cm", price: 7.0, stock: 18, sku: "PLA-DEC-BOI" },
      ],
    },
    {
      name: "Passoire Inox Grand Format",
      brand: "HomeCook",
      unit: "piece",
      weightGrams: 400,
      description: "Indispensable pour égoutter le riz, haricots et pâtes.",
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Diamètre 24cm", price: 4.0, stock: 40, sku: "PAS-INO-24C" },
      ],
    },
  ],

  // 9. Petits équipements ménagers
  "2d0c1535-6cd1-47ca-9a49-5ab1d4ea77aa": [
    {
      name: "Mixeur Blender Moulinex 1.5L",
      brand: "Moulinex",
      unit: "piece",
      weightGrams: 2200,
      description: "Blender 400W avec moulin à épices inclus.",
      images: [
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "400W 1.5L", price: 28.0, stock: 12, sku: "MOU-BLE-15L" },
      ],
    },
    {
      name: "Bouilloire Électrique Inox 2.0L",
      brand: "Sayona",
      unit: "piece",
      weightGrams: 900,
      description:
        "Chauffe l'eau rapidement avec arrêt automatique de sécurité.",
      images: [
        "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "2.0L 1500W", price: 12.0, stock: 30, sku: "SAY-BOU-20L" },
      ],
    },
    {
      name: "Fer à Repasser à Vapeur Philips",
      brand: "Philips",
      unit: "piece",
      weightGrams: 1300,
      description:
        "Semelle antiadhésive et débit de vapeur continu pour repassage net.",
      images: [
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "2000W Vapeur", price: 22.0, stock: 15, sku: "PHI-FER-VAP" },
      ],
    },
    {
      name: "Réchaud Électrique 2 Plaques",
      brand: "Rashnik",
      unit: "piece",
      weightGrams: 3100,
      description:
        "Double plaque de cuisson en fonte durable et thermostat réglable.",
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "2000W Double plaque",
          price: 19.0,
          stock: 20,
          sku: "RAS-REC-2PL",
        },
      ],
    },
    {
      name: "Hachoir à Viande & Légumes Manuel",
      brand: "HandyCraft",
      unit: "piece",
      weightGrams: 1500,
      description: "Hachoir mécanique à manivelle fixation sur table.",
      images: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Taille N°10 Inox",
          price: 15.0,
          stock: 10,
          sku: "HAC-MAN-10I",
        },
      ],
    },
    {
      name: "Ventilateur Sur Pied Orientable",
      brand: "Binatone",
      unit: "piece",
      weightGrams: 4200,
      description: "Ventilateur 16 pouces avec 3 vitesses et minuterie.",
      images: [
        "https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "16 pouces Noir", price: 25.0, stock: 18, sku: "BIN-VEN-16P" },
      ],
    },
  ],

  // 10. Soins du visage & du corps
  "c2f16357-c589-4277-82a2-2261283ee0fa": [
    {
      name: "Lait Corporel Nivea Cocoa Butter 400ml",
      brand: "Nivea",
      unit: "bouteille",
      weightGrams: 400,
      description:
        "Nourrit intensément la peau sèche grâce au beurre de cacao pur.",
      images: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "400ml Flacon Pompe",
          price: 6.5,
          stock: 30,
          sku: "NIV-LAI-400",
        },
      ],
    },
    {
      name: "Beurre de Karité Pur Artisanal",
      brand: "Kivu Shea",
      unit: "pot",
      weightGrams: 250,
      description:
        "Karité 100% naturel non raffiné, parfait pour l'hydratation quotidienne.",
      images: [
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pot 250g", price: 4.0, stock: 40, sku: "KAR-PUR-250" },
      ],
    },
    {
      name: "Crème Hydratante Visage Neutrogena",
      brand: "Neutrogena",
      unit: "pot",
      weightGrams: 50,
      description: "Gel-crème Hydro Boost à l'acide hyaluronique.",
      images: [
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pot 50ml", price: 12.0, stock: 15, sku: "NEU-CRE-50M" },
      ],
    },
    {
      name: "Huile d'Avocat Pression à Froid",
      brand: "Kivu Oils",
      unit: "bouteille",
      weightGrams: 100,
      description:
        "Huile de soin visage et cheveux extraite d'avocats de Masisi.",
      images: [
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Flacon 100ml", price: 5.0, stock: 25, sku: "HUI-AVO-100" },
      ],
    },
    {
      name: "Savon Noir Gommage Beldi",
      brand: "Bio Beauty",
      unit: "pot",
      weightGrams: 200,
      description:
        "Savon pâteux aux huiles essentielles pour exfolier la peau au bain.",
      images: [
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pot 200g", price: 3.5, stock: 35, sku: "SAV-NOI-200" },
      ],
    },
    {
      name: "Écran Solaire Garnier SPF 50",
      brand: "Garnier",
      unit: "tube",
      weightGrams: 50,
      description: "Protection solaire haute efficacité contre les UV.",
      images: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Tube 50ml", price: 10.0, stock: 20, sku: "GAR-SOL-50M" },
      ],
    },
  ],

  // 11. Soins capillaires
  "164cc924-7b48-4798-b5a2-b4916d17e6fe": [
    {
      name: "Shampoing Dark and Lovely 250ml",
      brand: "Dark and Lovely",
      unit: "bouteille",
      weightGrams: 250,
      description:
        "Shampoing nettoyant et démêlant enrichi à l'huile d'avocat.",
      images: [
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Flacon 250ml", price: 3.5, stock: 40, sku: "DAR-SHA-250" },
      ],
    },
    {
      name: "Baume Capillaire Cantu Shea Butter",
      brand: "Cantu",
      unit: "pot",
      weightGrams: 340,
      description:
        "Crème réparatrice sans rincage pour cheveux crépus et bouclés.",
      images: [
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pot 340g", price: 7.5, stock: 25, sku: "CAN-BAU-340" },
      ],
    },
    {
      name: "Huile de Ricin Pur (Castor Oil)",
      brand: "Kivu Organics",
      unit: "bouteille",
      weightGrams: 120,
      description:
        "Favorise la repousse rapide et la fortification des cheveux.",
      images: [
        "https://images.unsplash.com/photo-1608248597309-a1d2e1fe04c9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Flacon 120ml", price: 4.0, stock: 30, sku: "RIC-PUR-120" },
      ],
    },
    {
      name: "Kit Défrisant ORS Olive Oil",
      brand: "ORS",
      unit: "boite",
      weightGrams: 500,
      description:
        "Kit défrisant à l'huile d'olive protégeant le cuir chevelu.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Normal", price: 6.0, stock: 20, sku: "ORS-DEF-NOR" },
        { name: "Super", price: 6.0, stock: 15, sku: "ORS-DEF-SUP" },
      ],
    },
    {
      name: "Mèche Synthétique Darling Yaki Braids",
      brand: "Darling",
      unit: "paquet",
      weightGrams: 150,
      description: "Mèches légères pour tresses afro (Braids / Box Braids).",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Couleur Noir 1B", price: 1.5, stock: 100, sku: "DAR-MEC-1B" },
        { name: "Couleur Marron 27", price: 1.5, stock: 50, sku: "DAR-MEC-27" },
      ],
    },
    {
      name: "Peigne Démêloir à Dents Larges",
      brand: "SalonPro",
      unit: "piece",
      weightGrams: 50,
      description: "Peigne antistatique robuste spécial cheveux crépus.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir Inox", price: 1.0, stock: 80, sku: "PEI-DEM-NOI" },
      ],
    },
  ],

  // 12. Maquillage
  "ba2157f5-2135-4653-9331-9e892d2db98f": [
    {
      name: "Fond de Teint Maybelline Fit Me",
      brand: "Maybelline",
      unit: "flacon",
      weightGrams: 30,
      description: "Fond de teint matifiant fini naturel longue tenue.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Teinte 330 Toffee",
          price: 11.0,
          stock: 15,
          sku: "MAY-FIT-330",
        },
        {
          name: "Teinte 355 Coconut",
          price: 11.0,
          stock: 15,
          sku: "MAY-FIT-355",
        },
      ],
    },
    {
      name: "Rouge à Lèvres M.A.C Matte",
      brand: "M.A.C",
      unit: "piece",
      weightGrams: 15,
      description: "Pigmentation intense et tenue jusqu'à 12 heures.",
      images: [
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Ruby Woo (Rouge)",
          price: 15.0,
          stock: 10,
          sku: "MAC-LIP-RUB",
        },
        {
          name: "Velvet Teddy (Nude)",
          price: 15.0,
          stock: 10,
          sku: "MAC-LIP-VEL",
        },
      ],
    },
    {
      name: "Poudre Compacte HUDABEAUTY",
      brand: "Huda Beauty",
      unit: "piece",
      weightGrams: 50,
      description:
        "Poudre libre fixatrice pour un teint parfait sans brillance.",
      images: [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Teinte Kunafa", price: 18.0, stock: 12, sku: "HUD-POU-KUN" },
      ],
    },
    {
      name: "Mascara L'Oréal Lash Paradise",
      brand: "L'Oréal",
      unit: "piece",
      weightGrams: 20,
      description: "Volume intense et longueur spectaculaire sans paquets.",
      images: [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir Intense Waterproof",
          price: 9.0,
          stock: 20,
          sku: "LOR-MAS-WAT",
        },
      ],
    },
    {
      name: "Kit Pinceaux de Maquillage Set de 12",
      brand: "GlamBrush",
      unit: "ensemble",
      weightGrams: 200,
      description: "Poils synthétiques ultra doux dans une pochette élégante.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Set 12 Pinceaux Rose Gold",
          price: 10.0,
          stock: 25,
          sku: "GLA-PIN-12R",
        },
      ],
    },
    {
      name: "Crayon à Sourcils Précision Pro",
      brand: "NYX",
      unit: "piece",
      weightGrams: 10,
      description:
        "Mine rétractable ultra-fine avec brosse goupillon intégrée.",
      images: [
        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Brun Foncé", price: 4.5, stock: 30, sku: "NYX-CRA-BRU" },
      ],
    },
  ],

  // 13. Parfums
  "ba6217e5-ae36-4f12-8690-09e817f8328f": [
    {
      name: "Eau de Parfum Sauvage 100ml",
      brand: "Dior",
      unit: "flacon",
      weightGrams: 350,
      description: "Notes fraîches et boisées emblématiques pour homme.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "100ml Spray", price: 85.0, stock: 5, sku: "DIO-SAU-100" },
      ],
    },
    {
      name: "Parfum La Vie Est Belle 75ml",
      brand: "Lancôme",
      unit: "flacon",
      weightGrams: 300,
      description: "Sillage gourmand à l'iris et au patchouli.",
      images: [
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "75ml Spray", price: 78.0, stock: 8, sku: "LAN-VIE-075" },
      ],
    },
    {
      name: "Huile de Parfum Orientale Oud Royal",
      brand: "Dubai Scents",
      unit: "flacon",
      weightGrams: 100,
      description: "Parfum concentré sans alcool à l'extrait de bois d'oud.",
      images: [
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Roll-on 12ml", price: 12.0, stock: 25, sku: "OUD-ROY-12M" },
      ],
    },
    {
      name: "Spray Corporel Victoria's Secret",
      brand: "Victoria's Secret",
      unit: "bouteille",
      weightGrams: 250,
      description: "Brume parfumée légère pour le corps.",
      images: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pure Seduction 250ml",
          price: 14.0,
          stock: 20,
          sku: "VIC-BRU-PUR",
        },
        {
          name: "Love Spell 250ml",
          price: 14.0,
          stock: 20,
          sku: "VIC-BRU-LOV",
        },
      ],
    },
    {
      name: "Parfum One Million 100ml",
      brand: "Paco Rabanne",
      unit: "flacon",
      weightGrams: 350,
      description: "Parfum ambré épicé séduisant pour homme.",
      images: [
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "100ml Spray", price: 80.0, stock: 6, sku: "PAC-MIL-100" },
      ],
    },
    {
      name: "Eau de Cologne Fraîche Mont St Michel",
      brand: "Mont St Michel",
      unit: "bouteille",
      weightGrams: 250,
      description: "Cologne traditionnelle rafraîchissante après le bain.",
      images: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "250ml Flacon", price: 4.5, stock: 30, sku: "MON-COL-250" },
      ],
    },
  ],

  // 14. Hygiène personnelle
  "8c8d2188-eaf4-4add-b576-ffab2b8f1b5f": [
    {
      name: "Dentifrice Colgate Triple Action 100ml",
      brand: "Colgate",
      unit: "tube",
      weightGrams: 100,
      description:
        "Protection contre les caries, dents blanches et haleine fraîche.",
      images: [
        "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Tube 100ml", price: 1.2, stock: 100, sku: "COL-DEN-100" },
      ],
    },
    {
      name: "Savon de Toilette Dettol Original",
      brand: "Dettol",
      unit: "piece",
      weightGrams: 110,
      description: "Savon antibactérien protégeant contre 99.9% des germes.",
      images: [
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pain 110g", price: 0.9, stock: 120, sku: "DET-SAV-110" },
      ],
    },
    {
      name: "Déo Spray Nivea Men Dry Impact",
      brand: "Nivea",
      unit: "spray",
      weightGrams: 150,
      description: "Protection anti-transpirante efficace 48 heures.",
      images: [
        "https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Aérosol 150ml", price: 3.5, stock: 40, sku: "NIV-DEO-150" },
      ],
    },
    {
      name: "Serviettes Hygiéniques Always Ultra Normal",
      brand: "Always",
      unit: "paquet",
      weightGrams: 100,
      description: "Protection ultra absorbante avec ailettes.",
      images: [
        "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Paquet de 10", price: 1.5, stock: 90, sku: "ALW-SER-PK10" },
      ],
    },
    {
      name: "Brosses à Dents Medium Oral-B Pack de 3",
      brand: "Oral-B",
      unit: "paquet",
      weightGrams: 60,
      description: "Poils multi-niveaux pour un nettoyage en profondeur.",
      images: [
        "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pack de 3 brosses",
          price: 2.2,
          stock: 60,
          sku: "ORA-BRO-PK3",
        },
      ],
    },
    {
      name: "Rasoirs Jetables Gillette2 Pack de 5",
      brand: "Gillette",
      unit: "paquet",
      weightGrams: 80,
      description: "Rasoirs double lame avec bande lubrifiante.",
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607006344380-b6775a0824a7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585830810419-7ac6e4f841cd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pack de 5 rasoirs",
          price: 2.0,
          stock: 70,
          sku: "GIL-RAS-PK5",
        },
      ],
    },
  ],

  // 15. Vêtements homme
  "2516b292-47e8-43e7-a95c-5f8432552444": [
    {
      name: "Chemise Homme en Pagne Wax Congolais",
      brand: "Congo Fashion",
      unit: "piece",
      weightGrams: 300,
      description: "Chemise sur mesure cousue à Goma en tissu Wax de qualité.",
      images: [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille M", price: 15.0, stock: 10, sku: "CHE-WAX-HOM-M" },
        { name: "Taille L", price: 15.0, stock: 12, sku: "CHE-WAX-HOM-L" },
        { name: "Taille XL", price: 15.0, stock: 8, sku: "CHE-WAX-HOM-XL" },
      ],
    },
    {
      name: "Pantalon Jean Homme Slim Fit",
      brand: "Denim Co",
      unit: "piece",
      weightGrams: 600,
      description: "Jean résistant en coton extensible.",
      images: [
        "https://images.unsplash.com/photo-1542272604-780c36856842?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille 32 Bleu", price: 18.0, stock: 15, sku: "JEA-SLI-32B" },
        { name: "Taille 34 Noir", price: 18.0, stock: 10, sku: "JEA-SLI-34N" },
      ],
    },
    {
      name: "Costume Homme 2 Pièces Éléganter",
      brand: "Sapeur Class",
      unit: "ensemble",
      weightGrams: 1400,
      description: "Veste et pantalon bien ajustés pour événements officiels.",
      images: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille 50 Noir", price: 65.0, stock: 5, sku: "COS-HOM-50N" },
      ],
    },
    {
      name: "Polo Homme Coton Lacoste Classic",
      brand: "Lacoste",
      unit: "piece",
      weightGrams: 250,
      description: "Polo classique respirant col boutonné.",
      images: [
        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Blanc L", price: 12.0, stock: 20, sku: "POL-LAC-WHT" },
        { name: "Bleu Marine L", price: 12.0, stock: 15, sku: "POL-LAC-NAV" },
      ],
    },
    {
      name: "T-shirt Homme Oversized Streetwear",
      brand: "Urban Kivu",
      unit: "piece",
      weightGrams: 200,
      description: "T-shirt en coton épais style décontracté.",
      images: [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir XL", price: 8.0, stock: 25, sku: "TSH-OVE-XLN" },
      ],
    },
    {
      name: "Veste en Cuir Homme Casual",
      brand: "Wild Style",
      unit: "piece",
      weightGrams: 1100,
      description: "Veste synthétique effet cuir de bonne finition.",
      images: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille L Marron", price: 35.0, stock: 8, sku: "VES-CUI-LMA" },
      ],
    },
  ],

  // 16. Vêtements femme
  "82640928-022d-4d5c-9f40-fbaadb9e644f": [
    {
      name: "Robe de Fête en Pagne Super Wax",
      brand: "AfriChic",
      unit: "piece",
      weightGrams: 400,
      description:
        "Robe longue moderne taillée dans du pagne hollandais authentique.",
      images: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Taille M / Motif Rouge",
          price: 25.0,
          stock: 8,
          sku: "ROB-WAX-MR",
        },
        {
          name: "Taille L / Motif Bleu",
          price: 25.0,
          stock: 10,
          sku: "ROB-WAX-LB",
        },
      ],
    },
    {
      name: "Pagne Hollandais Vlisco 6 Yards",
      brand: "Vlisco",
      unit: "piece",
      weightGrams: 800,
      description: "Tissu Wax Hollandais original 100% coton.",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pièce 6 Yards", price: 60.0, stock: 12, sku: "VLI-WAX-6YD" },
      ],
    },
    {
      name: "Ensemble Kimono & Pantalon Soie",
      brand: "Goma Glam",
      unit: "ensemble",
      weightGrams: 350,
      description: "Ensemble fluide et confortable pour sortie ou maison.",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Taille Unique Vert",
          price: 20.0,
          stock: 15,
          sku: "ENS-KIM-VER",
        },
      ],
    },
    {
      name: "Jupe Plissée Longue Tendances",
      brand: "Fashion Nova",
      unit: "piece",
      weightGrams: 300,
      description: "Jupe élégante élastique à la taille.",
      images: [
        "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille M/L Noir", price: 14.0, stock: 18, sku: "JUP-PLI-NOI" },
      ],
    },
    {
      name: "Blouse Femme Coton Brodé",
      brand: "Zara",
      unit: "piece",
      weightGrams: 200,
      description: "Haut col V léger avec manches bouffantes.",
      images: [
        "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Taille S/M Blanc",
          price: 10.0,
          stock: 22,
          sku: "BLO-BRO-BLA",
        },
      ],
    },
    {
      name: "Legging de Sport Gainant Femme",
      brand: "Gymshark",
      unit: "piece",
      weightGrams: 220,
      description: "Legging taille haute anti-transpirant.",
      images: [
        "https://images.unsplash.com/photo-1506629082925-2368b736763a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille M Gris", price: 12.0, stock: 20, sku: "LEG-SPO-GRI" },
      ],
    },
  ],

  // 17. Vêtements enfant
  "7e8977c7-135b-403f-9418-f4dd9e5e4202": [
    {
      name: "Ensemble Garçon T-shirt & Short Coton",
      brand: "Kids Club",
      unit: "ensemble",
      weightGrams: 250,
      description: "Tenue d'été respirante pour garçon de 3 à 6 ans.",
      images: [
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "4 Ans", price: 8.0, stock: 15, sku: "ENS-GAR-04A" },
        { name: "6 Ans", price: 8.0, stock: 15, sku: "ENS-GAR-06A" },
      ],
    },
    {
      name: "Robe Fille Princesse Tulle Rose",
      brand: "Little Queen",
      unit: "piece",
      weightGrams: 300,
      description: "Jolie robe de fête avec paillettes pour fillette.",
      images: [
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille 5 Ans", price: 12.0, stock: 10, sku: "ROB-FIL-05A" },
      ],
    },
    {
      name: "Pyjama Bébé Coton Doux Pack de 2",
      brand: "Carter's",
      unit: "paquet",
      weightGrams: 200,
      description: "Pyjamas grenouillères avec fermeture éclair.",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "12 Mois", price: 10.0, stock: 20, sku: "PYJ-BEB-12M" },
      ],
    },
    {
      name: "Manteau Chaud Enfant avec Capuche",
      brand: "Kivu Kids",
      unit: "piece",
      weightGrams: 450,
      description: "Veste rembourrée idéale pour les soirées fraîches de Goma.",
      images: [
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Taille 8 Ans Bleu",
          price: 15.0,
          stock: 12,
          sku: "MAN-ENF-08B",
        },
      ],
    },
    {
      name: "Uniforme Scolaire Bleuet (Chemise + Short)",
      brand: "Ecolier Congo",
      unit: "ensemble",
      weightGrams: 350,
      description: "Tenue d'école primaire conforme aux normes locales.",
      images: [
        "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille 10 Ans", price: 9.0, stock: 40, sku: "UNI-SCO-10A" },
      ],
    },
    {
      name: "Chaussettes Enfant Coton Pack de 5",
      brand: "Disney Kids",
      unit: "paquet",
      weightGrams: 100,
      description: "Chaussettes souples aux motifs colorés.",
      images: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pointure 28-32", price: 3.0, stock: 50, sku: "CHA-ENF-PK5" },
      ],
    },
  ],

  // 18. Chaussures
  "0f52a5c3-ce68-4d02-bc7f-7d33fdc6433d": [
    {
      name: "Baskets Nike Air Force 1 All White",
      brand: "Nike",
      unit: "paire",
      weightGrams: 950,
      description:
        "Tennis légendaires entièrement blanches en cuir synthétique.",
      images: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pointure 41", price: 35.0, stock: 8, sku: "NIK-AF1-41" },
        { name: "Pointure 42", price: 35.0, stock: 12, sku: "NIK-AF1-42" },
        { name: "Pointure 43", price: 35.0, stock: 10, sku: "NIK-AF1-43" },
      ],
    },
    {
      name: "Chaussures en Cuir Homme Richelieu",
      brand: "Clarks",
      unit: "paire",
      weightGrams: 1100,
      description: "Chaussures de ville élégantes en cuir véritable.",
      images: [
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pointure 42 Noir", price: 45.0, stock: 6, sku: "CLA-RIC-42N" },
      ],
    },
    {
      name: "Sandales Talons Hauts Femme Glamour",
      brand: "Zara Woman",
      unit: "paire",
      weightGrams: 600,
      description: "Sandales à lanières pour mariages et soirées.",
      images: [
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pointure 38 Or", price: 22.0, stock: 10, sku: "SAN-TAL-38O" },
      ],
    },
    {
      name: "Babouches en Cuir Fait Main",
      brand: "Artisanat Congo",
      unit: "paire",
      weightGrams: 400,
      description:
        "Sandales ouvertes très confortables pour la maison ou sorties.",
      images: [
        "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pointure 40 Marron",
          price: 12.0,
          stock: 20,
          sku: "BAB-CUI-40M",
        },
      ],
    },
    {
      name: "Bottes de Pluie / Sécurité Caoutchouc",
      brand: "WorkSafe",
      unit: "paire",
      weightGrams: 1400,
      description: "Bottes hautes étanches pour temps de pluie ou chantiers.",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pointure 43 Noir",
          price: 15.0,
          stock: 25,
          sku: "BOT-PLU-43N",
        },
      ],
    },
    {
      name: "Mocassins Homme Suédine Soft",
      brand: "Moccasin Co",
      unit: "paire",
      weightGrams: 700,
      description: "Mocassins légers et souples sans lacets.",
      images: [
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pointure 41 Bleu",
          price: 20.0,
          stock: 14,
          sku: "MOC-SUE-41B",
        },
      ],
    },
  ],

  // 19. Accessoires (Mode)
  "39fc79cb-689f-4995-83bb-be42d6feb6a4": [
    {
      name: "Sac à Main Femme Cuir Synthétique Luxe",
      brand: "Michael Kors",
      unit: "piece",
      weightGrams: 750,
      description: "Grand sac fourre-tout élégant avec lanière bandoulière.",
      images: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir Cuir", price: 28.0, stock: 10, sku: "SAC-MAI-NOI" },
        { name: "Beige Camel", price: 28.0, stock: 8, sku: "SAC-MAI-BEI" },
      ],
    },
    {
      name: "Montre Homme Quartz Bracelet Inox",
      brand: "Curren",
      unit: "piece",
      weightGrams: 180,
      description: "Montre chronographe étanche design raffiné.",
      images: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Cadran Noir / Inox Argent",
          price: 20.0,
          stock: 15,
          sku: "MON-CUR-ARG",
        },
      ],
    },
    {
      name: "Lunettes de Soleil Ray-Ban Aviator",
      brand: "Ray-Ban",
      unit: "piece",
      weightGrams: 80,
      description: "Verres teintés protection UV400 avec étui rigide.",
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Monture Dorée / Verres Noirs",
          price: 15.0,
          stock: 20,
          sku: "LUN-RAY-DOR",
        },
      ],
    },
    {
      name: "Ceinture Homme en Cuir Reversible",
      brand: "Tommy Hilfiger",
      unit: "piece",
      weightGrams: 180,
      description:
        "Ceinture double face Noir et Marron avec boucle métallique.",
      images: [
        "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Taille 115cm", price: 9.0, stock: 25, sku: "CEI-REV-115" },
      ],
    },
    {
      name: "Casquette NY Yankees Adjustable",
      brand: "New Era",
      unit: "piece",
      weightGrams: 120,
      description: "Casquette de baseball brodée taille réglable.",
      images: [
        "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir Logo Blanc", price: 7.0, stock: 30, sku: "CAS-NYY-NOI" },
      ],
    },
    {
      name: "Portefeuille Homme Cuir Compact",
      brand: "Baellerry",
      unit: "piece",
      weightGrams: 100,
      description: "Portefeuille multi-cartes avec compartiment monnaie.",
      images: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Marron Foncé", price: 6.0, stock: 40, sku: "POR-BAE-MAR" },
      ],
    },
  ],

  // 20. Salon
  "c62b7d61-02e0-4d52-b9d3-a952f8c204fa": [
    {
      name: "Canapé d'Angle 5 Places en Tissu Tisse",
      brand: "Meubles du Kivu",
      unit: "ensemble",
      weightGrams: 45000,
      description:
        "Canapé d'angle spacieux et moelleux fabriqué par les artisans de Goma.",
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Gris Anthracite", price: 380.0, stock: 3, sku: "CAN-ANG-GRI" },
        { name: "Bleu Canard", price: 380.0, stock: 2, sku: "CAN-ANG-BLE" },
      ],
    },
    {
      name: "Table Basse en Bois Massif et Verre",
      brand: "WoodDesign",
      unit: "piece",
      weightGrams: 15000,
      description: "Table basse rectangulaire au design moderne.",
      images: [
        "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Finition Chêne Clair",
          price: 85.0,
          stock: 5,
          sku: "TAB-BAS-BOI",
        },
      ],
    },
    {
      name: "Meuble TV Moderne avec Rangements",
      brand: "Home Decor",
      unit: "piece",
      weightGrams: 20000,
      description: "Meuble télé suspendu ou sur pieds jusqu'à 65 pouces.",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Longueur 160cm Blanc/Bois",
          price: 110.0,
          stock: 4,
          sku: "MEU-TV-160",
        },
      ],
    },
    {
      name: "Tapis de Salon Shaggy Moelleux 200x300cm",
      brand: "SweetHome",
      unit: "piece",
      weightGrams: 6000,
      description: "Tapis antidérapant très doux sous les pieds.",
      images: [
        "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "200x300cm Beige", price: 45.0, stock: 8, sku: "TAP-SHA-BEI" },
      ],
    },
    {
      name: "Fauteuil Relax Inclinable Skai",
      brand: "Comfort Plus",
      unit: "piece",
      weightGrams: 18000,
      description: "Fauteuil individuel avec repose-pieds rétractable.",
      images: [
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir Simili-Cuir",
          price: 130.0,
          stock: 4,
          sku: "FAU-REL-NOI",
        },
      ],
    },
    {
      name: "Étagère Bibliothèque en Bois 5 Niveaux",
      brand: "WoodArt",
      unit: "piece",
      weightGrams: 12000,
      description: "Rangement livres et déco style industriel.",
      images: [
        "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Hauteur 180cm", price: 70.0, stock: 6, sku: "BIB-BOI-180" },
      ],
    },
  ],

  // 21. Chambre à coucher
  "bd0e0249-4834-4c1f-bd49-6eeef6e41ddb": [
    {
      name: "Lit en Bois Massif 2 Places 180x200cm",
      brand: "Menuiserie du Lac",
      unit: "piece",
      weightGrams: 35000,
      description: "Cadre de lit king size solide avec tête de lit travaillée.",
      images: [
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "180x200cm King Size",
          price: 220.0,
          stock: 4,
          sku: "LIT-BOI-180",
        },
      ],
    },
    {
      name: "Matelas Orthopédique HR 180x200cm",
      brand: "ComfySleep",
      unit: "piece",
      weightGrams: 22000,
      description: "Matelas mousse haute densité idéal pour le soutien du dos.",
      images: [
        "https://images.unsplash.com/photo-1629949009765-40fe7459b318?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Épaisseur 25cm", price: 190.0, stock: 6, sku: "MAT-ORT-180" },
      ],
    },
    {
      name: "Garde-Robe Armoire 3 Portes Coulissantes",
      brand: "Ikea Style",
      unit: "piece",
      weightGrams: 55000,
      description: "Grand dressing avec penderie et miroir intégré.",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Blanc Mat 200cm", price: 280.0, stock: 2, sku: "ARM-3PO-BLA" },
      ],
    },
    {
      name: "Drap de Lit Coton Satiné 4 Pièces",
      brand: "Bedding Luxury",
      unit: "ensemble",
      weightGrams: 1500,
      description: "Drap housse, drap plat et 2 taies d'oreiller ultra doux.",
      images: [
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Blanc Pur 180x200cm",
          price: 25.0,
          stock: 15,
          sku: "DRA-COT-BLA",
        },
        {
          name: "Gris Perle 180x200cm",
          price: 25.0,
          stock: 15,
          sku: "DRA-COT-GRI",
        },
      ],
    },
    {
      name: "Table de Chevet 2 Tiroirs Bois",
      brand: "WoodDesign",
      unit: "piece",
      weightGrams: 5000,
      description: "Petite table de nuit assortie aux cadres de lit modernes.",
      images: [
        "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Chêne / Tiroir Blanc",
          price: 35.0,
          stock: 10,
          sku: "TAB-CHE-2T",
        },
      ],
    },
    {
      name: "Coiffeuse Mousse avec Miroir LED",
      brand: "GlamRoom",
      unit: "piece",
      weightGrams: 1400,
      description: "Meuble de maquillage avec tabouret et miroir lumineux.",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Blanc Luxe", price: 120.0, stock: 3, sku: "COI-MIR-LED" },
      ],
    },
  ],

  // 22. Cuisine & salle à manger
  "0254b614-e92d-4c23-be2c-42314947b9a5": [
    {
      name: "Table à Manger 6 Places avec Chaises",
      brand: "Maison & Confort",
      unit: "ensemble",
      weightGrams: 32000,
      description: "Table en bois traité résistant avec 6 chaises matelassées.",
      images: [
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Set 1 Table + 6 Chaises",
          price: 250.0,
          stock: 3,
          sku: "TAB-MAN-6CH",
        },
      ],
    },
    {
      name: "Service de Table Porcelaine 24 Pièces",
      brand: "Luminarc",
      unit: "ensemble",
      weightGrams: 8000,
      description: "Assiettes creuses, plates et tasses pour 6 personnes.",
      images: [
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Blanc Motifs Dorés",
          price: 45.0,
          stock: 8,
          sku: "SER-POR-24P",
        },
      ],
    },
    {
      name: "Ensemble Ménagère Inox 24 Couverts",
      brand: "Pradel",
      unit: "ensemble",
      weightGrams: 1200,
      description: "Fourchettes, couteaux, cuillères à soupe et à café.",
      images: [
        "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Coffret Inox Polir",
          price: 20.0,
          stock: 15,
          sku: "MEN-INO-24P",
        },
      ],
    },
    {
      name: "Verres à Eau & Jus Cristal Pack de 6",
      brand: "Pasabahce",
      unit: "paquet",
      weightGrams: 1400,
      description: "Verres transparents renforcés résistants aux chocs.",
      images: [
        "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Pack de 6 (330ml)",
          price: 8.0,
          stock: 25,
          sku: "VER-EAU-PK6",
        },
      ],
    },
    {
      name: "Buffet Rangement Vaisselle Cuisine",
      brand: "Maison Design",
      unit: "piece",
      weightGrams: 28000,
      description: "Meuble de cuisine avec tiroirs et portes vitrées.",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bois & Blanc", price: 160.0, stock: 3, sku: "BUF-CUI-BOI" },
      ],
    },
    {
      name: "Nappe de Table Imperméable 6-8 Places",
      brand: "HomeTex",
      unit: "piece",
      weightGrams: 500,
      description: "Nappe lavable anti-taches idéale pour repas de famille.",
      images: [
        "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "150x220cm Motifs Carreaux",
          price: 10.0,
          stock: 20,
          sku: "NAP-IMP-150",
        },
      ],
    },
  ],

  // 23. Bureau
  "3f8a2675-b3a2-419b-a41b-c897e318b9d4": [
    {
      name: "Chaise de Bureau Ergonomique Mesh",
      brand: "ErgoOffice",
      unit: "piece",
      weightGrams: 11000,
      description:
        "Chaise à dossier respirant avec accoudoirs et soutien lombaire.",
      images: [
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir Réglable", price: 65.0, stock: 12, sku: "CHA-BUR-ERG" },
      ],
    },
    {
      name: "Bureau d'Angle Informatique Métal & Bois",
      brand: "OfficeCraft",
      unit: "piece",
      weightGrams: 18000,
      description:
        "Grand bureau d'angle pour ordinateur portable et moniteurs.",
      images: [
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Format L 140cm", price: 95.0, stock: 5, sku: "BUR-ANG-140" },
      ],
    },
    {
      name: "Caisson de Rangement 3 Tiroirs sur Roulettes",
      brand: "SteelCabinet",
      unit: "piece",
      weightGrams: 9000,
      description: "Caisson en métal verrouillable avec clé pour dossiers.",
      images: [
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Métal Gris", price: 50.0, stock: 8, sku: "CAI-RAN-3TI" },
      ],
    },
    {
      name: "Lampe de Bureau LED Articulée USB",
      brand: "Baseus",
      unit: "piece",
      weightGrams: 400,
      description:
        "Lampe de travail tactile avec 3 modes de couleur d'éclairage.",
      images: [
        "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Blanc Tactile USB",
          price: 15.0,
          stock: 20,
          sku: "LAM-LED-USB",
        },
      ],
    },
    {
      name: "Organiseur de Bureau en Maillage Métallique",
      brand: "Deli",
      unit: "piece",
      weightGrams: 300,
      description:
        "Rangement multifonction pour stylos, courriers et fournitures.",
      images: [
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir 4 compartiments",
          price: 6.0,
          stock: 30,
          sku: "ORG-BUR-MET",
        },
      ],
    },
    {
      name: "Sous-Main Cuir Synthétique 80x40cm",
      brand: "Knodel",
      unit: "piece",
      weightGrams: 350,
      description:
        "Tapis de bureau imperméable servant aussi de tapis de souris géant.",
      images: [
        "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir 80x40cm", price: 10.0, stock: 25, sku: "SOU-MAI-80N" },
      ],
    },
  ],

  // 24. Décoration
  "81c21020-8f12-46df-9dfd-6014b90e25cd": [
    {
      name: "Tableau Peinture d'Artiste Kivu (Paysage)",
      brand: "Art Goma",
      unit: "piece",
      weightGrams: 1500,
      description: "Toile peinte à la main représentant le volcan Nyiragongo.",
      images: [
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Cadre 60x90cm", price: 40.0, stock: 5, sku: "TAB-PEI-NYI" },
      ],
    },
    {
      name: "Horloge Murale Géante 3D 100cm",
      brand: "Modern Decor",
      unit: "piece",
      weightGrams: 500,
      description: "Horloge adhésive à monter soi-même au salon.",
      images: [
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Miroir Argenté 100cm",
          price: 15.0,
          stock: 20,
          sku: "HOR-MUR-3DA",
        },
      ],
    },
    {
      name: "Vase en Céramique Design Minimaliste",
      brand: "ClayArt",
      unit: "piece",
      weightGrams: 900,
      description: "Vase artisanal pour fleurs fraîches ou séchées.",
      images: [
        "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Hauteur 25cm Blanc",
          price: 12.0,
          stock: 15,
          sku: "VAS-CER-25B",
        },
      ],
    },
    {
      name: "Miroir Mural Rond Cadre Métal Doré",
      brand: "GlamHome",
      unit: "piece",
      weightGrams: 3200,
      description: "Miroir élégant pour entrée ou salon.",
      images: [
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Diamètre 60cm Doré",
          price: 25.0,
          stock: 10,
          sku: "MIR-RON-60D",
        },
      ],
    },
    {
      name: "Rideaux Occultants Doublés Set de 2",
      brand: "DecoTex",
      unit: "ensemble",
      weightGrams: 1800,
      description: "Rideaux bloquant 90% de la lumière extérieure.",
      images: [
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "140x260cm Gris Foncé",
          price: 22.0,
          stock: 12,
          sku: "RID-OCC-140",
        },
      ],
    },
    {
      name: "Plante Artificielle Monchera en Pot",
      brand: "GreenDecor",
      unit: "piece",
      weightGrams: 1200,
      description: "Plante synthétique plus vraie que nature sans entretien.",
      images: [
        "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Hauteur 70cm avec Pot",
          price: 18.0,
          stock: 15,
          sku: "PLA-ART-70C",
        },
      ],
    },
  ],

  // 25. Téléphones & accessoires
  "e6ffbdf0-0dea-44ed-9c87-ff73ac036a35": [
    {
      name: "Smartphone Tecno Spark 10 Pro 128GB",
      brand: "Tecno",
      unit: "piece",
      weightGrams: 200,
      description:
        "Téléphone très populaire avec caméra selfie 32MP et batterie 5000mAh.",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "8GB RAM / 128GB Noir",
          price: 135.0,
          stock: 10,
          sku: "TEC-SP10-128N",
        },
        {
          name: "8GB RAM / 128GB Blanc",
          price: 135.0,
          stock: 8,
          sku: "TEC-SP10-128B",
        },
      ],
    },
    {
      name: "Samsung Galaxy A14 64GB",
      brand: "Samsung",
      unit: "piece",
      weightGrams: 201,
      description: "Écran 6.6 pouces Full HD+ triple capteur photo.",
      images: [
        "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "4GB RAM / 64GB Noir",
          price: 145.0,
          stock: 12,
          sku: "SAM-A14-64N",
        },
      ],
    },
    {
      name: "Power Bank Oraimo 20000mAh Fast Charge",
      brand: "Oraimo",
      unit: "piece",
      weightGrams: 400,
      description:
        "Batterie externe haute capacité idéale pendant les coupures d'électricité.",
      images: [
        "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "20000mAh 12W", price: 18.0, stock: 35, sku: "ORA-POW-20K" },
      ],
    },
    {
      name: "Écouteurs sans Fil Bluetooth AirDots",
      brand: "Xiaomi",
      unit: "piece",
      weightGrams: 50,
      description: "Oreillettes True Wireless avec boîtier de charge.",
      images: [
        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir Bluetooth 5.2",
          price: 14.0,
          stock: 25,
          sku: "XIA-AIR-NOI",
        },
      ],
    },
    {
      name: "Chargeur Rapide USB-C 20W avec Câble",
      brand: "Itel",
      unit: "piece",
      weightGrams: 80,
      description: "Chargeur mural compatible Android et iPhone.",
      images: [
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Adaptateur + Câble Type C",
          price: 6.0,
          stock: 50,
          sku: "ITE-CHA-20W",
        },
      ],
    },
    {
      name: "Carte Mémoire MicroSD 64GB Class 10",
      brand: "SanDisk",
      unit: "piece",
      weightGrams: 10,
      description: "Extension de stockage ultra rapide pour photos et vidéos.",
      images: [
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "64GB Ultra 100MB/s",
          price: 8.0,
          stock: 40,
          sku: "SAN-MIC-64G",
        },
      ],
    },
  ],

  // 26. Ordinateurs & accessoires
  "39ef981a-2d67-4123-b884-5e6bb9143395": [
    {
      name: "PC Portatif HP 15 Intel Core i5 8GB 512GB SSD",
      brand: "HP",
      unit: "piece",
      weightGrams: 1700,
      description:
        "Ordinateur portable performant pour travail de bureau et études.",
      images: [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Core i5 / 8GB / 512GB SSD",
          price: 420.0,
          stock: 4,
          sku: "HP15-I5-512",
        },
      ],
    },
    {
      name: "Souris sans Fil Optique Logitech M185",
      brand: "Logitech",
      unit: "piece",
      weightGrams: 80,
      description: "Souris compacte avec nano-récepteur USB plug and play.",
      images: [
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Gris / Noir", price: 10.0, stock: 30, sku: "LOG-SOU-M185" },
      ],
    },
    {
      name: "Sac à Dos pour Ordinateur Portable 15.6",
      brand: "Lenovo",
      unit: "piece",
      weightGrams: 500,
      description: "Sac à dos imperméable avec compartiment matelassé.",
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir 15.6 pouces",
          price: 18.0,
          stock: 20,
          sku: "LEN-SAC-156",
        },
      ],
    },
    {
      name: "Disque Dur Externe 1TB USB 3.0",
      brand: "Toshiba",
      unit: "piece",
      weightGrams: 150,
      description: "Sauvegarde rapide de vos fichiers en toute sécurité.",
      images: [
        "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "1TB Canvio Basics",
          price: 48.0,
          stock: 15,
          sku: "TOS-DD-01T",
        },
      ],
    },
    {
      name: "Clé USB 32GB Metal Body",
      brand: "Kingston",
      unit: "piece",
      weightGrams: 20,
      description: "Clé USB compacte ultra résistante en métal.",
      images: [
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "32GB DataTraveler",
          price: 5.0,
          stock: 50,
          sku: "KIN-USB-32G",
        },
      ],
    },
    {
      name: "Casque Audio avec Micro pour Visioconférence",
      brand: "JBL",
      unit: "piece",
      weightGrams: 220,
      description: "Casque confortable réduction de bruit passive.",
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Noir Filaire Jack 3.5mm",
          price: 22.0,
          stock: 18,
          sku: "JBL-CAS-MIC",
        },
      ],
    },
  ],

  // 27. Audio & TV
  "f953b1c9-d12b-47ee-a8a9-8961e72f2501": [
    {
      name: "Téléviseur Smart TV 43 pouces Full HD",
      brand: "Hisense",
      unit: "piece",
      weightGrams: 7500,
      description:
        "Télévision connectée avec Youtube, Netflix et décodeur intégré.",
      images: [
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "43 pouces Android TV",
          price: 230.0,
          stock: 5,
          sku: "HIS-TV-43S",
        },
      ],
    },
    {
      name: "Baffle Bluetooth Rechargeable Subwoofer",
      brand: "JBL Charge 5",
      unit: "piece",
      weightGrams: 960,
      description:
        "Enceinte sans fil étanche avec basses profondes et batterie 20h.",
      images: [
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir 30W", price: 110.0, stock: 8, sku: "JBL-CHA-5N" },
      ],
    },
    {
      name: "Radio Portable Solaire FM/AM/SW avec Lampe",
      brand: "Golon",
      unit: "piece",
      weightGrams: 650,
      description: "Radio rechargeable par panneau solaire, batterie ou piles.",
      images: [
        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Solaire + Bluetooth",
          price: 15.0,
          stock: 25,
          sku: "GOL-RAD-SOL",
        },
      ],
    },
    {
      name: "Home Cinéma Soundbar 2.1 Bluetooth 120W",
      brand: "Sony",
      unit: "ensemble",
      weightGrams: 5500,
      description:
        "Barre de son avec caisson de basses filaire pour expérience cinéma.",
      images: [
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "120W RMS", price: 140.0, stock: 4, sku: "SON-SOU-120" },
      ],
    },
    {
      name: "Décodeur TV Canal+ HD complet",
      brand: "Canal+",
      unit: "ensemble",
      weightGrams: 800,
      description: "Kit décodeur avec télécommande et câble HDMI.",
      images: [
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Kit Décodeur HD", price: 20.0, stock: 15, sku: "CAN-DEC-HD" },
      ],
    },
    {
      name: "Support TV Murale Inclinable 32-55 pouces",
      brand: "Universal TV",
      unit: "piece",
      weightGrams: 1500,
      description: "Support en acier renforcé avec niveau à bulle inclus.",
      images: [
        "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1577979749830-f1d742b96791?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "32 à 55 pouces", price: 10.0, stock: 30, sku: "SUP-TV-55P" },
      ],
    },
  ],

  // 28. Électroménager
  "fcbe0f45-13ee-40c3-a9ce-feac9e83cf7f": [
    {
      name: "Réfrigérateur Double Porte 200L",
      brand: "Westpool",
      unit: "piece",
      weightGrams: 38000,
      description: "Réfrigérateur économique à faible consommation d'énergie.",
      images: [
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "200 Litres Gris Inox",
          price: 260.0,
          stock: 3,
          sku: "WES-REF-200",
        },
      ],
    },
    {
      name: "Machine à Laver Automatique 7kg",
      brand: "LG",
      unit: "piece",
      weightGrams: 45000,
      description: "Chargement frontal avec technologie Inverter Direct Drive.",
      images: [
        "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "7kg Blanc", price: 340.0, stock: 2, sku: "LG-MAL-07K" },
      ],
    },
    {
      name: "Four à Micro-Onde 20L Numérique",
      brand: "Sharp",
      unit: "piece",
      weightGrams: 10500,
      description: "Micro-ondes 800W avec fonction décongélation rapide.",
      images: [
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "20L 800W Digital", price: 75.0, stock: 6, sku: "SHA-MIC-20L" },
      ],
    },
    {
      name: "Cuisinière à Gaz 4 Foyers avec Four",
      brand: "Midea",
      unit: "piece",
      weightGrams: 24000,
      description: "Cuisinière avec sécurité gaz et tournebroche.",
      images: [
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "50x50cm Inox", price: 160.0, stock: 4, sku: "MID-CUI-4F" },
      ],
    },
    {
      name: "Congélateur Coffre 150L Deep Freezer",
      brand: "Haier",
      unit: "piece",
      weightGrams: 32000,
      description:
        "Conserve la glace et les aliments congelés jusqu'à 48h sans courant.",
      images: [
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "150 Litres Blanc",
          price: 210.0,
          stock: 3,
          sku: "HAI-CON-150",
        },
      ],
    },
    {
      name: "Friteuse sans Huile Air Fryer 4.5L",
      brand: "Ninja",
      unit: "piece",
      weightGrams: 4200,
      description: "Cuisson saine et croustillante avec 80% d'huile en moins.",
      images: [
        "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "4.5L 1500W Digital",
          price: 85.0,
          stock: 7,
          sku: "NIN-AIR-45L",
        },
      ],
    },
  ],

  // 29. Gadgets & accessoires divers
  "acba8d1e-5ac9-49a2-b865-fba3ffd9870f": [
    {
      name: "Panneau Solaire Portable 100W pliable",
      brand: "SolarTech",
      unit: "piece",
      weightGrams: 2800,
      description:
        "Panneau solaire pliable idéal pour charger téléphones et batteries.",
      images: [
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "100W USB / DC Output",
          price: 75.0,
          stock: 10,
          sku: "SOL-PAN-100",
        },
      ],
    },
    {
      name: "Lampe Torche Rechargeable Solaire LED",
      brand: "DP Light",
      unit: "piece",
      weightGrams: 350,
      description:
        "Torche longue portée indispensable pour vos déplacements nocturnes.",
      images: [
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "15W Ultra Puissante",
          price: 8.0,
          stock: 40,
          sku: "DPL-TOR-15W",
        },
      ],
    },
    {
      name: "Montre Connectée Smartwatch Y68",
      brand: "FitPro",
      unit: "piece",
      weightGrams: 60,
      description:
        "Calcule le pouls, le nombre de pas et affiche les notifications.",
      images: [
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Noir Silicone", price: 10.0, stock: 30, sku: "FIT-SMA-Y68" },
      ],
    },
    {
      name: "Rallonge Électrique Multiprise 5 Prises",
      brand: "Bull",
      unit: "piece",
      weightGrams: 450,
      description:
        "Bloc multiprise avec interrupteur et protection contre les surtensions.",
      images: [
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Câble 3 Mètres", price: 7.0, stock: 35, sku: "BUL-MUL-03M" },
      ],
    },
    {
      name: "Trépied Ring Light avec Support Téléphone",
      brand: "SelfiePro",
      unit: "piece",
      weightGrams: 900,
      description:
        "Anneau lumineux LED 26cm sur trépied de 210cm pour créateurs de contenu.",
      images: [
        "https://images.unsplash.com/photo-1527011046414-4781f1f94f8c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        {
          name: "Ring Light 26cm + Trépied",
          price: 16.0,
          stock: 20,
          sku: "RIN-LIG-210",
        },
      ],
    },
    {
      name: "Cadenas de Sécurité en Laiton 50mm",
      brand: "Tri-Circle",
      unit: "piece",
      weightGrams: 250,
      description:
        "Cadenas renforcé à 3 clés pour la protection des portes et portails.",
      images: [
        "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "50mm avec 3 Clés", price: 4.0, stock: 50, sku: "TRI-CAD-50M" },
      ],
    },
  ],
};

async function seed() {
  console.log("🌱 Starting Product Seed for Goma Market...");

  // Verify the provided shop exists
  const shop = await prisma.shop.findUnique({
    where: { id: SHOP_ID },
  });

  if (!shop) {
    console.error(
      `❌ Shop ID "${SHOP_ID}" not found. Please provide a valid Shop ID from your database.`,
    );
    process.exit(1);
  }

  let totalProductsCreated = 0;

  for (const subcategory of SUBCATEGORIES) {
    const products = PRODUCTS_DATA[subcategory.id];

    if (!products || products.length === 0) {
      console.warn(
        `⚠️ No products defined for subcategory: ${subcategory.name}`,
      );
      continue;
    }

    console.log(
      `\n📦 Seeding ${products.length} products for subcategory: "${subcategory.name}"`,
    );

    for (const prodData of products) {
      const slug = slugify(
        `${prodData.name}-${Date.now().toString().slice(-4)}`,
      );

      // Calculate expiry date if food item (mandatory check in service)
      const expiresAt = subcategory.isFood
        ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // Default 6 months ahead
        : null;

      try {
        await prisma.$transaction(async (tx) => {
          // 1. Create Product
          const product = await tx.product.create({
            data: {
              shopId: SHOP_ID,
              subcategoryId: subcategory.id,
              name: prodData.name,
              slug: slug,
              description: prodData.description,
              brand: prodData.brand || null,
              unit: prodData.unit || "piece",
              weightGrams: prodData.weightGrams || null,
              expiresAt: expiresAt,
              currency: "USD",
              status: "PUBLISHED", // Direct publish for seed data visibility
              hasVariants: prodData.variants.length > 1,
            },
          });

          // 2. Create Product Images (3 per product)
          if (prodData.images && prodData.images.length > 0) {
            await tx.productImage.createMany({
              data: prodData.images.map((url, index) => ({
                productId: product.id,
                url: url,
                publicId: `seed_${slug}_img_${index}`,
                position: index,
              })),
            });
          }

          // 3. Create Product Variants
          const createdVariants = await tx.productVariant.createManyAndReturn({
            data: prodData.variants.map((v, idx) => ({
              productId: product.id,
              name: v.name || null,
              sku: v.sku ? `${v.sku}-${Date.now().toString().slice(-3)}` : null,
              price: v.price,
              stock: v.stock,
              isDefault: idx === 0,
            })),
          });

          // 4. Create Stock Movements for Initial Stock
          const stockMovements = createdVariants
            .filter((v) => v.stock > 0)
            .map((v) => ({
              variantId: v.id,
              type: "RESTOCK",
              amount: v.stock,
              reason: "Initial seed stock balance",
              stockBefore: 0,
              stockAfter: v.stock,
            }));

          if (stockMovements.length > 0) {
            await tx.stockMovement.createMany({
              data: stockMovements,
            });
          }
        });

        totalProductsCreated++;
        console.log(`  ✓ Created: ${prodData.name}`);
      } catch (err) {
        console.error(
          `  ❌ Failed to create product "${prodData.name}":`,
          err.message,
        );
      }
    }
  }

  console.log(
    `\n✅ Seeding Complete! Total products created: ${totalProductsCreated}`,
  );
}

seed()
  .catch((e) => {
    console.error("❌ Fatal Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
