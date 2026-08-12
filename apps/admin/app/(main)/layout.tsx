import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { getDashboardPath } from "@/lib/get-dashboard-path";
import { canAccessPath, isStaffRole } from "@/lib/route-access";
import { DashboardShell } from "@/components/global/dashboard-shell";
import type { AuthUser } from "@/types/auth";

async function getCurrentUserOrRedirect(): Promise<AuthUser> {
  try {
    const user = await getMeServer();
    return user as AuthUser;
  } catch {
    redirect("/auth/login");
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserOrRedirect();

  if (!isStaffRole(user.role)) {
    redirect("/auth/login");
  }

  const pathname = (await headers()).get("x-pathname") ?? "/";

  if (!canAccessPath(pathname, user.role)) {
    redirect(getDashboardPath(user.role));
  }

  return <DashboardShell>{children}</DashboardShell>;
}
