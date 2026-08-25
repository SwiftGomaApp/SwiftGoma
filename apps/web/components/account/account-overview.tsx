"use client";

import Link from "next/link";
import { Bell, Heart, Package, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    greeting: (name: string) => (name ? `Welcome back, ${name}` : "Welcome back"),
    subtitle: "Manage your orders, favorites, and account security.",
    orders: "Orders",
    ordersDesc: "Track and review your past orders.",
    favorites: "Favorites",
    favoritesDesc: "Products you've saved for later.",
    security: "Security",
    securityDesc: "Sessions, two-factor auth, and passkeys.",
    notifications: "Notifications",
    notificationsDesc: "See what's new and manage preferences.",
  },
  fr: {
    greeting: (name: string) => (name ? `Bon retour, ${name}` : "Bon retour"),
    subtitle: "Gérez vos commandes, favoris et la sécurité de votre compte.",
    orders: "Commandes",
    ordersDesc: "Suivez et consultez vos commandes passées.",
    favorites: "Favoris",
    favoritesDesc: "Produits que vous avez enregistrés.",
    security: "Sécurité",
    securityDesc: "Sessions, double authentification et clés d'accès.",
    notifications: "Notifications",
    notificationsDesc: "Consultez les nouveautés et vos préférences.",
  },
} as const;

export function AccountOverview({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user } = useAuth();

  const sections = [
    {
      href: "/account/orders",
      icon: Package,
      label: t.orders,
      description: t.ordersDesc,
    },
    {
      href: "/account/favorites",
      icon: Heart,
      label: t.favorites,
      description: t.favoritesDesc,
    },
    {
      href: "/account/security",
      icon: Shield,
      label: t.security,
      description: t.securityDesc,
    },
    {
      href: "/account/notifications",
      icon: Bell,
      label: t.notifications,
      description: t.notificationsDesc,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.greeting(user?.name ?? "")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, icon: Icon, label, description }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardContent className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AccountOverview;
