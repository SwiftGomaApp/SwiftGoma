const { getPrismaClient } = require("../src/config/prisma");
const {
  seedDefaultCategories,
} = require("../src/features/product/services/category.service");

const prisma = getPrismaClient();

const SHOP_ID =
  process.env.SEED_SHOP_ID ||
  process.argv[2] ||
  "87a93055-746c-43e7-912a-f7ac4eb9e74c";

const SUBCATEGORIES = [
  { key: "boissons", name: "Boissons", isFood: true },
  { key: "snacks", name: "Snacks & confiseries", isFood: true },
];

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PRODUCTS_DATA = {
  // ===================== BOISSONS =====================
  boissons: [
    // --- Boissons Fraîches ---
    {
      name: "Eau Minérale",
      brand: null,
      unit: "bouteille",
      weightGrams: 500,
      currency: "CDF",
      description: "Bouteille d'eau minérale fraîche, servie glacée.",
      images: [
        "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille", price: 1000, stock: 100, sku: "REH-EAU-MIN" },
      ],
    },
    {
      name: "Fanta, Coca Cola",
      brand: "Coca-Cola",
      unit: "canette",
      weightGrams: 330,
      currency: "CDF",
      description: "Canette bien fraîche de Fanta ou Coca-Cola, au choix.",
      images: [
        "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1554456854-55a089fd4cb2?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Canette", price: 1000, stock: 100, sku: "REH-FAN-COC" },
      ],
    },
    {
      name: "Jus Afia",
      brand: "Afia",
      unit: "bouteille",
      weightGrams: 500,
      currency: "CDF",
      description: "Jus de fruit Afia, rafraîchissant et sucré.",
      images: [
        "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille", price: 2500, stock: 60, sku: "REH-JUS-AFI" },
      ],
    },
    {
      name: "Bavaria",
      brand: "Bralima",
      unit: "bouteille",
      weightGrams: 650,
      currency: "CDF",
      description: "Bière Bavaria bien fraîche, servie glacée.",
      images: [
        "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille", price: 4500, stock: 40, sku: "REH-BAV-BOT" },
      ],
    },
    {
      name: "Inyange",
      brand: "Inyange",
      unit: "bouteille",
      weightGrams: 500,
      currency: "CDF",
      description: "Boisson Inyange, importée et servie fraîche.",
      images: [
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Bouteille", price: 5500, stock: 25, sku: "REH-INY-BOT" },
      ],
    },

    // --- Laits & Yaourts ---
    {
      name: "Lait Simple / Yaourt (400ml)",
      brand: null,
      unit: "pot",
      weightGrams: 400,
      currency: "CDF",
      description: "Lait simple ou yaourt nature, format 400ml.",
      images: [
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "400ml", price: 1500, stock: 50, sku: "REH-LAI-400" }],
    },
    {
      name: "Lait Simple / Yaourt (500ml)",
      brand: null,
      unit: "pot",
      weightGrams: 500,
      currency: "CDF",
      description: "Lait simple ou yaourt nature, format 500ml.",
      images: [
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "500ml", price: 2000, stock: 45, sku: "REH-LAI-500" }],
    },
    {
      name: "Lait Caillée (400ml)",
      brand: null,
      unit: "pot",
      weightGrams: 400,
      currency: "CDF",
      description: "Lait caillé traditionnel, format 400ml.",
      images: [
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "400ml", price: 3000, stock: 30, sku: "REH-CAI-400" }],
    },
    {
      name: "Lait Caillée (500ml)",
      brand: null,
      unit: "pot",
      weightGrams: 500,
      currency: "CDF",
      description: "Lait caillé traditionnel, format 500ml.",
      images: [
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "500ml", price: 3500, stock: 25, sku: "REH-CAI-500" }],
    },

    // --- Jus & Cocktails ---
    {
      name: "Jus Naturel — Mangue, Maracoudja, Prune, Ananas",
      brand: null,
      unit: "verre",
      weightGrams: 400,
      currency: "CDF",
      description:
        "Jus de fruit naturel pressé sur place — mangue, maracoudja, prune ou ananas au choix.",
      images: [
        "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Verre", price: 5000, stock: 40, sku: "REH-JUS-NAT" }],
    },
    {
      name: "Milkshake",
      brand: null,
      unit: "verre",
      weightGrams: 400,
      currency: "CDF",
      description: "Milkshake onctueux, préparé minute.",
      images: [
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Verre", price: 8000, stock: 25, sku: "REH-MIL-SHK" }],
    },
    {
      name: "Mojito",
      brand: null,
      unit: "verre",
      weightGrams: 350,
      currency: "CDF",
      description: "Mojito rafraîchissant à la menthe et au citron vert.",
      images: [
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Verre", price: 5000, stock: 30, sku: "REH-MOJ-VER" }],
    },
    {
      name: "Mannish",
      brand: null,
      unit: "verre",
      weightGrams: 300,
      currency: "CDF",
      description: "Boisson maison Mannish, spécialité du chef.",
      images: [
        "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Verre", price: 2000, stock: 35, sku: "REH-MAN-VER" }],
    },

    // --- Cafés & Thés ---
    {
      name: "Café au Lait",
      brand: null,
      unit: "tasse",
      weightGrams: 200,
      currency: "CDF",
      description: "Café au lait chaud, préparé à la commande.",
      images: [
        "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Tasse", price: 3000, stock: 50, sku: "REH-CAF-LAI" }],
    },
    {
      name: "Café Simple",
      brand: null,
      unit: "tasse",
      weightGrams: 150,
      currency: "CDF",
      description: "Café noir simple, servi chaud.",
      images: [
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Tasse", price: 3000, stock: 50, sku: "REH-CAF-SIM" }],
    },
    {
      name: "Thé Accompagné",
      brand: null,
      unit: "tasse",
      weightGrams: 200,
      currency: "CDF",
      description: "Thé chaud servi accompagné.",
      images: [
        "https://images.unsplash.com/photo-1560023907-5f339617ea30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Tasse", price: 4000, stock: 35, sku: "REH-THE-ACC" }],
    },
  ],

  // ===================== SNACKS & CONFISERIES (Menu Foods) =====================
  snacks: [
    // --- Entrées & Snacks ---
    {
      name: "Samoussa (5 pcs)",
      brand: null,
      unit: "portion",
      weightGrams: 250,
      currency: "CDF",
      description: "5 samoussas croustillants, garnis et frits minute.",
      images: [
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "5 pièces", price: 8000, stock: 30, sku: "REH-SAM-5P" },
      ],
    },
    {
      name: "Crêpes au Chocolat (3 pcs)",
      brand: null,
      unit: "portion",
      weightGrams: 200,
      currency: "CDF",
      description: "3 crêpes garnies au chocolat fondant.",
      images: [
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "3 pièces", price: 4000, stock: 25, sku: "REH-CRE-CHO" },
      ],
    },
    {
      name: "Crêpes Simples",
      brand: null,
      unit: "piece",
      weightGrams: 80,
      currency: "CDF",
      description: "Crêpe nature, légère et moelleuse.",
      images: [
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Pièce", price: 500, stock: 60, sku: "REH-CRE-SIM" }],
    },
    {
      name: "Arachides (300ml)",
      brand: null,
      unit: "portion",
      weightGrams: 200,
      currency: "CDF",
      description: "Arachides grillées et croustillantes, format 300ml.",
      images: [
        "https://images.unsplash.com/photo-1567892999348-6001083e9b11?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1536591375315-1988168b7832?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "300ml", price: 2000, stock: 40, sku: "REH-ARA-300" }],
    },
    {
      name: "Chips / Plantains Frits (300ml)",
      brand: null,
      unit: "portion",
      weightGrams: 150,
      currency: "CDF",
      description: "Chips de plantain frits, croustillants, format 300ml.",
      images: [
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "300ml", price: 1000, stock: 50, sku: "REH-CHI-PLA" }],
    },
    {
      name: "Croquettes (300ml)",
      brand: null,
      unit: "portion",
      weightGrams: 200,
      currency: "CDF",
      description: "Croquettes dorées et croustillantes, format 300ml.",
      images: [
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "300ml", price: 2000, stock: 40, sku: "REH-CRO-300" }],
    },
    {
      name: "Galettes",
      brand: null,
      unit: "piece",
      weightGrams: 80,
      currency: "CDF",
      description: "Galette maison, simple et savoureuse.",
      images: [
        "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Pièce", price: 500, stock: 60, sku: "REH-GAL-PIE" }],
    },
    {
      name: "Boulettes Secs (4 pcs)",
      brand: null,
      unit: "portion",
      weightGrams: 200,
      currency: "CDF",
      description: "4 boulettes de viande sèches, épicées et savoureuses.",
      images: [
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "4 pièces", price: 5000, stock: 25, sku: "REH-BOU-4P" },
      ],
    },
    {
      name: "Omelette Espagnol",
      brand: null,
      unit: "portion",
      weightGrams: 250,
      currency: "CDF",
      description: "Omelette espagnole garnie de légumes.",
      images: [
        "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Portion", price: 5000, stock: 20, sku: "REH-OME-ESP" },
      ],
    },

    // --- Shawarma & Burgers ---
    {
      name: "Shawarma",
      brand: null,
      unit: "piece",
      weightGrams: 350,
      currency: "CDF",
      description: "Shawarma garni de viande grillée, légumes et sauce maison.",
      images: [
        "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Pièce", price: 6500, stock: 25, sku: "REH-SHA-PIE" }],
    },
    {
      name: "Mini Pizza",
      brand: null,
      unit: "piece",
      weightGrams: 300,
      currency: "CDF",
      description: "Mini pizza garnie, cuite au four.",
      images: [
        "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601924582970-9238bcb495d9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600628421055-4d30de868b8f?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [{ name: "Pièce", price: 4500, stock: 20, sku: "REH-PIZ-MIN" }],
    },
    {
      name: "Hamburger (Boeuf)",
      brand: null,
      unit: "piece",
      weightGrams: 350,
      currency: "CDF",
      description:
        "Hamburger au bœuf grillé, garni de crudités et sauce maison.",
      images: [
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Pièce", price: 10000, stock: 20, sku: "REH-HAM-BOE" },
      ],
    },
    {
      name: "Saucisson + Chikwangue",
      brand: null,
      unit: "portion",
      weightGrams: 300,
      currency: "CDF",
      description: "Saucisson grillé accompagné de chikwangue.",
      images: [
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Portion", price: 4000, stock: 25, sku: "REH-SAU-CHI" },
      ],
    },
    {
      name: "Saucisson de Paris, Jambon + Fromage",
      brand: null,
      unit: "portion",
      weightGrams: 250,
      currency: "CDF",
      description: "Assiette de saucisson de Paris, jambon et fromage.",
      images: [
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Portion", price: 5000, stock: 20, sku: "REH-SAU-JAM" },
      ],
    },

    // --- Plats Frittes ---
    {
      name: "Plat Frittes Simple (frites, mayo, piment, salade + 1 oeuf)",
      brand: null,
      unit: "assiette",
      weightGrams: 400,
      currency: "CDF",
      description:
        "Frites, mayonnaise, piment, salade et un œuf — le plat frites simple.",
      images: [
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 4000, stock: 30, sku: "REH-FRI-SIM" },
      ],
    },
    {
      name: "Plat Frittes + Accomp. (frites, plantain + 1 saucisse)",
      brand: null,
      unit: "assiette",
      weightGrams: 600,
      currency: "CDF",
      description: "Frites, plantain frit et une saucisse grillée.",
      images: [
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 10000, stock: 20, sku: "REH-FRI-SAU" },
      ],
    },
    {
      name: "Plat Frittes + Accomp. (frites, plantain + mini viandes)",
      brand: null,
      unit: "assiette",
      weightGrams: 650,
      currency: "CDF",
      description: "Frites, plantain frit et mini viandes grillées assorties.",
      images: [
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 13000, stock: 15, sku: "REH-FRI-MIN" },
      ],
    },
    {
      name: "Plat Frittes + Accomp. (frites, plantain + poisson braisé)",
      brand: null,
      unit: "assiette",
      weightGrams: 700,
      currency: "CDF",
      description: "Frites, plantain frit et poisson braisé.",
      images: [
        "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 15000, stock: 15, sku: "REH-FRI-POI" },
      ],
    },

    // --- Pâtes & Spaghetti ---
    {
      name: "Plat Spaghetti + Saucisson",
      brand: null,
      unit: "assiette",
      weightGrams: 450,
      currency: "CDF",
      description: "Spaghetti sauce maison accompagné de saucisson.",
      images: [
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 5000, stock: 25, sku: "REH-SPA-SAU" },
      ],
    },
    {
      name: "Tortula de Patata",
      brand: null,
      unit: "assiette",
      weightGrams: 400,
      currency: "CDF",
      description: "Tortilla de pomme de terre à l'espagnole.",
      images: [
        "https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
      ],
      variants: [
        { name: "Assiette", price: 5000, stock: 20, sku: "REH-TOR-PAT" },
      ],
    },
  ],
};

async function loadSubcategoryIdsByName() {
  const rows = await prisma.subcategory.findMany({
    select: { id: true, name: true },
  });
  return new Map(rows.map((row) => [row.name, row.id]));
}

async function ensureSubcategoriesExist(subcategoryByName) {
  const missing = SUBCATEGORIES.filter(
    (sub) => !subcategoryByName.has(sub.name),
  );
  if (missing.length === 0) return subcategoryByName;

  console.log(
    `⚠️  ${missing.length} subcategory(ies) missing — seeding default categories first...`,
  );
  await seedDefaultCategories();
  return loadSubcategoryIdsByName();
}

async function seed() {
  console.log("🌱 Starting Product Seed for ReHub FastFood (Goma)...");

  const shop = await prisma.shop.findUnique({
    where: { id: SHOP_ID },
    select: { id: true, name: true },
  });

  if (!shop) {
    const shops = await prisma.shop.findMany({
      select: { id: true, name: true, slug: true },
      take: 10,
    });
    console.error(`❌ Shop ID "${SHOP_ID}" not found.`);
    if (shops.length > 0) {
      console.error("\nAvailable shops:");
      for (const candidate of shops) {
        console.error(
          `  - ${candidate.name} (${candidate.slug}): ${candidate.id}`,
        );
      }
      console.error(
        "\nRe-run with: SEED_SHOP_ID=<shop-id> npm run seed:products",
      );
    } else {
      console.error("No shops found in the database.");
    }
    process.exit(1);
  }

  console.log(`🏪 Using shop: ${shop.name} (${shop.id})`);

  let subcategoryByName = await loadSubcategoryIdsByName();
  subcategoryByName = await ensureSubcategoriesExist(subcategoryByName);

  let totalProductsCreated = 0;

  for (const subcategory of SUBCATEGORIES) {
    const subcategoryId = subcategoryByName.get(subcategory.name);
    if (!subcategoryId) {
      console.warn(
        `⚠️ Subcategory "${subcategory.name}" still missing after category seed — skipping.`,
      );
      continue;
    }

    const products = PRODUCTS_DATA[subcategory.key];

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

      const expiresAt = subcategory.isFood
        ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        : null;

      try {
        await prisma.$transaction(async (tx) => {
          const product = await tx.product.create({
            data: {
              shopId: SHOP_ID,
              subcategoryId,
              name: prodData.name,
              slug: slug,
              description: prodData.description,
              brand: prodData.brand || null,
              unit: prodData.unit || "piece",
              weightGrams: prodData.weightGrams || null,
              expiresAt: expiresAt,
              currency: prodData.currency || "USD",
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
