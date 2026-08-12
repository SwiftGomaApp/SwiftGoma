export const BRAND = {
  name: "SwiftGoma",
  tagline: "Achats en ligne et livraison rapide et fiable",
  description:
    "SwiftGoma connecte acheteurs, vendeurs et livreurs pour des achats en ligne rapides et sécurisés en RDC et au Rwanda. Achetez, vendez et livrez — tout dans une seule application.",
  shortDescription:
    "Achetez, vendez et livrez avec SwiftGoma — la marketplace conçue pour la RDC et le Rwanda.",
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://swiftgoma.com").replace(
    /\/+$/,
    "",
  ),
  supportEmail: "support@swiftgoma.com",
  locale: "fr_CD",
  ogLocale: "fr_CD",
  twitterHandle: "@swiftgomaapp",
  keywords: [
    "SwiftGoma",
    "achats en ligne RDC",
    "e-commerce Congo",
    "e-commerce Rwanda",
    "marketplace Goma",
    "marketplace Congo",
    "livraison Goma",
    "boutique en ligne RDC",
    "acheter en ligne Congo",
  ],
  social: {
    instagram: "https://instagram.com/swiftgomaapp",
    facebook: "https://facebook.com/swiftgomaapp",
    tiktok: "https://tiktok.com/@swiftgomaapp",
  },
} as const;

export const SITE_URL = BRAND.siteUrl;
