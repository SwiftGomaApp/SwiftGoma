import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { getDashboardPath } from "@/lib/get-dashboard-path";
import type { AuthUser } from "@/types/auth";

export default async function UserIndexPage() {
  let user: AuthUser;
  try {
    user = (await getMeServer()) as AuthUser;
  } catch {
    redirect("/auth/login");
  }

  redirect(getDashboardPath(user.role));
}
