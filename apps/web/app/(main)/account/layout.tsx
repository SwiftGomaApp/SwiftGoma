import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { getServerUser } from "@/lib/api/routes/auth.server";
import { getServerLocale } from "@/lib/language";
import { getRequestPathname } from "@/lib/auth/request-pathname.server";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();
  if (!user) {
    redirect(buildSignInHref(await getRequestPathname()));
  }

  const locale = await getServerLocale();

  return <AccountShell locale={locale}>{children}</AccountShell>;
}
