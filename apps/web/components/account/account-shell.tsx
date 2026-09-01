"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AccountNav } from "@/components/account/account-nav";
import type { Locale } from "@/lib/language";

// Live order tracking renders its own full-bleed, no-sidebar shell (map +
// packages panel) — it deliberately opts out of the standard account chrome.
const NO_CHROME_PATTERN = /^\/account\/orders\/[^/]+\/track(\/|$)/;

export function AccountShell({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const pathname = usePathname();

  if (NO_CHROME_PATTERN.test(pathname)) {
    return <div className="min-h-[calc(100vh-5rem)]">{children}</div>;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
        <div className="md:sticky md:top-24">
          <AccountNav locale={locale} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

export default AccountShell;
