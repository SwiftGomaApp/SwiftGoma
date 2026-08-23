import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { ModeToggle } from "@/components/global/theme-button";

export const metadata: Metadata = {
  title: {
    default: "Connexion | Swiftgoma",
    template: "%s | Swiftgoma",
  },
  description:
    "Connectez-vous à votre compte Swiftgoma pour accéder à vos achats, commandes et services de commerce local à Goma.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Connexion | Swiftgoma",
    description:
      "Accédez à votre compte Swiftgoma et profitez d'une expérience de commerce local simple, rapide et fiable à Goma.",
    type: "website",
    siteName: "Swiftgoma",
    locale: "fr_FR",
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="absolute right-6 top-6 z-10">
        <ModeToggle />
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        {children}
      </div>

      <footer className="shrink-0 flex items-center justify-center gap-4 px-6 py-4 text-sm text-muted-foreground">
        <Link
          href="/legal/terms"
          className="transition-colors hover:text-foreground"
        >
          Terms of Service
        </Link>

        <span className="text-border">•</span>

        <Link
          href="/legal/privacy"
          className="transition-colors hover:text-foreground"
        >
          Privacy Policy
        </Link>

        <span className="text-border">•</span>

        <Link
          href="/legal/cookies"
          className="transition-colors hover:text-foreground"
        >
          Cookie Policy
        </Link>
      </footer>
    </main>
  );
}
