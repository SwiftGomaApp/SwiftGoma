import type { ReactNode } from "react";
import { AccountNav } from "@/components/account/account-nav";
import { getServerLocale } from "@/lib/language";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <AccountNav locale={locale} />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
