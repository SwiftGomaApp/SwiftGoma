"use client";

import { NotificationsList } from "@/components/account/notifications-list";
import { NotificationsPreferences } from "@/components/account/notifications-preferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/lib/language";
import { PushNotificationStatus } from "./push-notification-status";

const STRINGS = {
  en: {
    title: "Notifications",
    subtitle: "Stay on top of orders, messages, and account activity.",
    all: "All",
    preferences: "Preferences",
  },
  fr: {
    title: "Notifications",
    subtitle: "Suivez vos commandes, messages et l'activité du compte.",
    all: "Toutes",
    preferences: "Préférences",
  },
} as const;

export function NotificationsAccountView({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">{t.all}</TabsTrigger>
          <TabsTrigger value="preferences">{t.preferences}</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-4">
          <NotificationsList locale={locale} />
        </TabsContent>
        <TabsContent value="preferences" className="pt-4">
          <div className="flex flex-col gap-4">
            <PushNotificationStatus  locale={locale} />
            <NotificationsPreferences locale={locale} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default NotificationsAccountView;
