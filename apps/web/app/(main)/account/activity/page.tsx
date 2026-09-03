import type { Metadata } from "next";
import { AccountActivityView } from "@/components/account/account-activity-view";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Recent activity | Swiftgoma",
};

export default async function AccountActivityPage() {
  const locale = await getServerLocale();
  return <AccountActivityView locale={locale} />;
}
