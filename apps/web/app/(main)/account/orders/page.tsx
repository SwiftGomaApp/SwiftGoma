import type { Metadata } from "next";
import { ComingSoon } from "@/components/account/coming-soon";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Orders | Swiftgoma",
};

const STRINGS = {
  en: { title: "Orders", description: "Your order history is coming soon." },
  fr: {
    title: "Commandes",
    description: "L'historique de vos commandes arrive bientôt.",
  },
} as const;

export default async function AccountOrdersPage() {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  return <ComingSoon title={t.title} description={t.description} />;
}
