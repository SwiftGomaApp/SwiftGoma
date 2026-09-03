"use client";

import { SecurityDeleteAccount } from "@/components/account/security-delete-account";
import { SecurityPasskeys } from "@/components/account/security-passkeys";
import { SecurityPassword } from "@/components/account/security-password";
import { SecuritySessions } from "@/components/account/security-sessions";
import { SecurityTwoFactor } from "@/components/account/security-two-factor";
import type { Locale } from "@/lib/language";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SecureAccountAction from "./secure-account-action";
import SecurityConnectedAccounts from "./security-connected-accounts";

const STRINGS = {
  en: {
    title: "Security",
    subtitle: "Manage how you sign in and keep your account safe.",
    secureAccountTitle: "Secure my account",
    secureAccountDescription:
      "Think your account was compromised? Lock it down immediately.",
  },
  fr: {
    title: "Sécurité",
    subtitle: "Gérez vos connexions et la sécurité de votre compte.",
    secureAccountTitle: "Sécuriser mon compte",
    secureAccountDescription:
      "Vous pensez que votre compte a été compromis ? Verrouillez-le immédiatement.",
  },
} as const;

export function SecurityView({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <SecurityPassword locale={locale} />
      <div className="border-t border-border" />
      <SecurityTwoFactor locale={locale} />
      <div className="border-t border-border" />
      <SecurityPasskeys locale={locale} />
      <div className="border-t border-border" />
      <SecurityConnectedAccounts locale={locale} />
      <div className="border-t border-border" />
      <SecuritySessions locale={locale} />
      <div className="border-t border-border" />

      <section className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {t.secureAccountTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t.secureAccountDescription}
          </p>
          <SecureAccountAction locale={locale} />
        </div>

        <SecurityDeleteAccount locale={locale} />
      </section>

      <Link
        href="/account/activity"
        className="flex items-center justify-between rounded-lg border border-border p-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
      >
        {locale === "fr" ? "Voir l'activité récente" : "View recent activity"}
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      <div className="border-t border-border" />
    </div>
  );
}

export default SecurityView;
