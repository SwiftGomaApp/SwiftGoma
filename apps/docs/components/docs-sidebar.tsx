"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const INTRODUCTION = [{ label: "Welcome", href: "/docs" }];

const GUIDES = [
  { label: "Authentication", href: "/docs/authentication" },
  { label: "Users", href: "/docs/users" },
  { label: "Products", href: "/docs/products" },
  { label: "Orders", href: "/docs/orders" },
  { label: "Seller Profile", href: "/docs/seller-profile" },
  { label: "Seller KYC", href: "/docs/kyc" },
  { label: "Payments", href: "/docs/payments" },
  { label: "MbiyoPay", href: "/docs/mbiyopay" },
  { label: "Shops", href: "/docs/shops" },
  { label: "Riders", href: "/docs/riders" },
  { label: "Billing", href: "/docs/billing" },
  { label: "Wallet", href: "/docs/wallet" },
  { label: "Expenses", href: "/docs/expenses" },
  { label: "Accounting", href: "/docs/accounting" },
  { label: "Notifications", href: "/docs/notifications" },
  { label: "Favorites", href: "/docs/favorites" },
  { label: "Support", href: "/docs/support" },
  { label: "Incidents", href: "/docs/incidents" },
  { label: "Blog", href: "/docs/blog" },
  { label: "Storefront", href: "/docs/storefront" },
  { label: "Dashboard", href: "/docs/dashboard" },
];

export function DocsSidebar() {
  const pathname = usePathname();

  const renderLinks = (items: { label: string; href: string }[]) =>
    items.map((item) => {
      const active = pathname === item.href;
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-1.5 text-sm transition",
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        </li>
      );
    });

  return (
    <nav className="scrollbar-thin sticky top-[6.5rem] h-[calc(100vh-6.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border px-3 py-6">
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Introduction
      </p>
      <ul className="mb-5 space-y-0.5">{renderLinks(INTRODUCTION)}</ul>

      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Guides
      </p>
      <ul className="space-y-0.5">{renderLinks(GUIDES)}</ul>
    </nav>
  );
}
