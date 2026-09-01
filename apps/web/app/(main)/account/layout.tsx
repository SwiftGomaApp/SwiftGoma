import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { getServerLocale } from "@/lib/language";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getServerLocale();

  return <AccountShell locale={locale}>{children}</AccountShell>;
}
