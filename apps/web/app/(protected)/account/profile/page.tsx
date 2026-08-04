// app/(protected)/account/profile/page.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User as UserIcon, ShieldCheck, Bell, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileInfo } from "@/components/settings/profile-info";
import { ProfileSecondaryEmail } from "@/components/settings/profile-secondary-email";

const NAV_ITEMS = [
  { href: "/account/profile", label: "Profil", icon: UserIcon },
  { href: "/account/settings", label: "Sécurité", icon: ShieldCheck },
  {
    href: "/account/settings?section=notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/account/settings?section=devices",
    label: "Appareils et sessions",
    icon: Laptop,
  },
];

export default function ProfilePage() {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Paramètres
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez votre compte et vos préférences.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav className="shrink-0 lg:w-56">
          <ul className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href.split("?")[0] &&
                item.href === "/account/profile";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4">
            <ProfileInfo />
            <ProfileSecondaryEmail />
          </div>
        </div>
      </div>
    </div>
  );
}
