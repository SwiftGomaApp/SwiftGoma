import type { Metadata } from "next";
import { ComingSoon } from "@/components/account/coming-soon";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Favorites | Swiftgoma",
};

const STRINGS = {
  en: {
    title: "Favorites",
    description: "Your saved products are coming soon.",
  },
  fr: {
    title: "Favoris",
    description: "Vos produits enregistrés arrivent bientôt.",
  },
} as const;

export default async function AccountFavoritesPage() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  return <ComingSoon title={t.title} description={t.description} />;
}
