"use client";

import { ProfileName } from "@/components/account/profile-name";
import { ProfilePhone } from "@/components/account/profile-phone";
import { ProfileSecondaryEmail } from "@/components/account/profile-secondary-email";
import { ProfileAddresses } from "@/components/account/profile-addresses";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Profile settings",
    subtitle: "Keep your personal details up to date.",
  },
  fr: {
    title: "Paramètres du profil",
    subtitle: "Gardez vos informations personnelles à jour.",
  },
} as const;

export function ProfileSettings({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <ProfileName locale={locale} />
      <div className="border-t border-border" />
      <ProfileSecondaryEmail locale={locale} />
      <div className="border-t border-border" />
      <ProfilePhone locale={locale} />
      <div className="border-t border-border" />
      <ProfileAddresses locale={locale} />
    </div>
  );
}

export default ProfileSettings;
