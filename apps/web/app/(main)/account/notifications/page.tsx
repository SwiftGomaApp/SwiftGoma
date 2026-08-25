import type { Metadata } from "next";
import { NotificationsAccountView } from "@/components/account/notifications-view";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Notifications | Swiftgoma",
};

export default async function AccountNotificationsPage() {
  const locale = await getServerLocale();
  return <NotificationsAccountView locale={locale} />;
}
