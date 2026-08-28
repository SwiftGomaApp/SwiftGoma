"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "API docs", href: "/docs" },
  { label: "API Reference", href: "/reference" },
];

export function SectionTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border px-4 sm:px-10 lg:px-16">
      <nav className="mx-auto flex max-w-[1600px] items-center gap-6">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative py-3 text-sm font-medium transition",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
