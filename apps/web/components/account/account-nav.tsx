"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Heart, Package, Shield, User } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/language";

const NAV_ITEMS = [
  { id: "overview", href: "/account", icon: User },
  { id: "orders", href: "/account/orders", icon: Package },
  { id: "favorites", href: "/account/favorites", icon: Heart },
  { id: "security", href: "/account/security", icon: Shield },
  { id: "notifications", href: "/account/notifications", icon: Bell },
] as const;

const STRINGS = {
  en: {
    overview: "Overview",
    orders: "Orders",
    favorites: "Favorites",
    security: "Security",
    notifications: "Notifications",
  },
  fr: {
    overview: "Aperçu",
    orders: "Commandes",
    favorites: "Favoris",
    security: "Sécurité",
    notifications: "Notifications",
  },
} as const;

export function AccountNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = STRINGS[locale];

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
      {NAV_ITEMS.map(({ id, href, icon: Icon }) => {
        const isActive =
          href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {t[id]}
          </Link>
        );
      })}
    </nav>
  );
}

export default AccountNav;
