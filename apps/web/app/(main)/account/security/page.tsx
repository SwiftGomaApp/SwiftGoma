import type { Metadata } from "next";
import { SecurityView } from "@/components/account/security-view";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Security | Swiftgoma",
};

export default async function AccountSecurityPage() {
  const locale = await getServerLocale();
  return <SecurityView locale={locale} />;
}
