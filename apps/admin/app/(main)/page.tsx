import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { getDashboardPath } from "@/lib/get-dashboard-path";
import type { AuthUser } from "@/types/auth";

export default async function MainIndexPage() {
  try {
    const user = (await getMeServer()) as AuthUser;
    redirect(getDashboardPath(user.role));
  } catch {
    redirect("/auth/login");
  }
}
