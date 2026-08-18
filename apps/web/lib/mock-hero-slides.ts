import type { ProductCardData } from "@/components/products/product-card";

export type HeroRole = "seller" | "buyer" | "rider" | "payment";

export type HeroSlide = {
  role: HeroRole;
  title: string;
  description: string;
  searchPlaceholder: string;
  image: string;
  products: [ProductCardData];
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    role: "seller",
    title: "Vendez vos produits facilement",
    description:
      "Ouvrez votre boutique en ligne et touchez des milliers d'acheteurs à Goma en quelques minutes.",
    searchPlaceholder: "Rechercher des produits à vendre...",
    image:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1600&q=80",
    products: [
      {
        slug: "huile-palme-5l",
        name: "Huile de palme 5L",
        images: [
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
        ],
        price: 12,
        currency: "USD",
        subtitle: "Bidon 5 litres",
      },
    ],
  },
  {
    role: "buyer",
    title: "Achetez tout ce dont vous avez besoin",
    description:
      "Des milliers de produits locaux, livrés rapidement chez vous à Goma et dans les environs.",
    searchPlaceholder: "Rechercher des produits...",
    image:
      "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1600&q=80",
    products: [
      {
        slug: "sac-a-main-cuir",
        name: "Sac à main en cuir",
        images: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80",
        ],
        price: 45,
        currency: "USD",
        subtitle: "Marron",
      },
    ],
  },
  {
    role: "rider",
    title: "Livrez et gagnez à votre rythme",
    description:
      "Rejoignez notre réseau de livreurs et générez des revenus en livrant des commandes près de chez vous.",
    searchPlaceholder: "Rechercher des livraisons...",
    image:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1600&q=80",
    products: [
      {
        slug: "sac-livraison-isotherme",
        name: "Sac de livraison isotherme",
        images: [
          "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400&q=80",
        ],
        price: 22,
        currency: "USD",
        subtitle: "20L",
      },
    ],
  },
  {
    role: "payment",
    title: "Payez en ligne en toute sécurité",
    description:
      "Mobile money, carte ou paiement à la livraison — choisissez le mode de paiement qui vous convient.",
    searchPlaceholder: "Rechercher des produits à payer...",
    image:
      "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1600&q=80",
    products: [
      {
        slug: "montre-connectee",
        name: "Montre connectée",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
        ],
        price: 39,
        currency: "USD",
        subtitle: "Bluetooth",
      },
    ],
  },
];
