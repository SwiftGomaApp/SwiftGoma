import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/account-overview";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "My Account | Swiftgoma",
};

export default async function AccountPage() {
  const locale = await getServerLocale();
  return <AccountOverview locale={locale} />;
}
