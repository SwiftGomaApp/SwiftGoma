"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ContactSupport } from "@/components/legal/contact-support";

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Conditions générales" },
  { href: "/legal/privacy", label: "Politique de confidentialité" },
  { href: "/legal/seller-terms", label: "Conditions Vendeurs" },
  { href: "/legal/buyer-terms", label: "Conditions Acheteurs" },
  { href: "/legal/delivery-terms", label: "Conditions Livreurs" },
  { href: "/legal/cookies", label: "Politique de cookies" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row">
      <nav className="shrink-0 md:w-56">
        <ul className="flex flex-col gap-1 md:sticky md:top-12">
          {LEGAL_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex-1">
        {children}
        <div className="mt-16 max-w-3xl">
          <ContactSupport />
        </div>
      </div>
    </div>
  );
}
