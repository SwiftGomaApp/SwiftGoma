export const ADMIN_BRAND = {
  name: "SwiftGoma",
  appName: "SwiftGoma Admin",
  description:
    "Tableau de bord d'administration SwiftGoma — gestion des vendeurs, commandes, abonnements, dépenses et livraisons pour la marketplace de Goma, RDC.",
  shortDescription:
    "Tableau de bord d'administration SwiftGoma pour la marketplace.",
  siteUrl: (
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.swiftgoma.com"
  ).replace(/\/+$/, ""),
  publicSiteUrl: (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://swiftgoma.com"
  ).replace(/\/+$/, ""),
  locale: "fr_CD",
} as const;

export const ADMIN_SITE_URL = ADMIN_BRAND.siteUrl;
