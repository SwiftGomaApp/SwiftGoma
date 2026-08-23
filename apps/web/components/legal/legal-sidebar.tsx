"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_NAV_ITEMS } from "@/lib/constants/legal";
import { Locale } from "@/lib/language";
import { cn } from "@/lib/utils";

export function LegalSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Legal pages" className="flex flex-col gap-1">
      {LEGAL_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {item.label[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
