import {
  Apple,
  Baby,
  BedDouble,
  Beef,
  Briefcase,
  Cable,
  Candy,
  ChefHat,
  Coffee,
  Cpu,
  CupSoda,
  Droplet,
  Droplets,
  Flower2,
  Footprints,
  Home,
  Laptop,
  Palette,
  Plug,
  Scissors,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  SprayCan,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Watch,
  Wheat,
} from "lucide-react";

type IconComponent = typeof Home;

// Keyed by category/subcategory slug so each one gets an icon that actually
// matches its meaning, not an arbitrary hash-picked icon. Update this map
// whenever a category is renamed or a new one is added in the admin panel.
const ICON_BY_SLUG: Record<string, IconComponent> = {
  // Categories
  "alimentation-boissons": UtensilsCrossed,
  "epicerie-produits-menagers": ShoppingBasket,
  "beaute-soins-personnels": Sparkles,
  "mode-vetements": Shirt,
  "fournitures-meuble": Sofa,
  electroniques: Cpu,

  // Alimentation & Boissons
  boissons: CupSoda,
  "produits-secs": Wheat,
  "fruits-legumes": Apple,
  "viande-poisson-volaille": Beef,
  "snacks-confiseries": Candy,

  // Épicerie / Produits ménagers
  "produits-d-entretien-nettoyage": SprayCan,
  "hygiene-de-la-maison": Droplets,
  "ustensiles-articles-de-cuisine": ChefHat,
  "petits-equipements-menagers": Plug,

  // Beauté & Soins personnels
  "soins-du-visage-du-corps": Droplet,
  "soins-capillaires": Scissors,
  maquillage: Palette,
  parfums: SprayCan,
  "hygiene-personnelle": Droplets,

  // Mode & Vêtements
  "vetements-homme": Shirt,
  "vetements-femme": Shirt,
  "vetements-enfant": Baby,
  chaussures: Footprints,
  accessoires: Watch,

  // Fournitures (meuble)
  salon: Sofa,
  "chambre-a-coucher": BedDouble,
  "cuisine-salle-a-manger": ChefHat,
  bureau: Briefcase,
  decoration: Flower2,

  // Électroniques
  "telephones-accessoires": Smartphone,
  "ordinateurs-accessoires": Laptop,
  "audio-tv": Tv,
  electromenager: WashingMachine,
  "gadgets-accessoires-divers": Cable,
};

const FALLBACK_ICONS: IconComponent[] = [
  Shirt,
  Sparkles,
  Smartphone,
  Home,
  Baby,
  Palette,
  Coffee,
  Watch,
];

function hashToIndex(seed: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % length;
}

/**
 * Looks up an icon by category/subcategory slug, falling back to a
 * deterministic (but not name-matched) icon for anything not yet mapped
 * above — e.g. a brand-new category added via the admin panel.
 */
export function getCategoryIcon(slug: string): IconComponent {
  return (
    ICON_BY_SLUG[slug] ?? FALLBACK_ICONS[hashToIndex(slug, FALLBACK_ICONS.length)]
  );
}
