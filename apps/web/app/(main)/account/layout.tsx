import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { getServerUser } from "@/lib/api/routes/auth.server";
import { getServerLocale } from "@/lib/language";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  const locale = await getServerLocale();

  return <AccountShell locale={locale}>{children}</AccountShell>;
}
