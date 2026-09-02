import type { Metadata } from "next";
import { NotificationsAllView } from "@/components/account/notifications-all-view";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "All notifications | Swiftgoma",
};

export default async function AllNotificationsPage() {
  const locale = await getServerLocale();
  return <NotificationsAllView locale={locale} />;
}
