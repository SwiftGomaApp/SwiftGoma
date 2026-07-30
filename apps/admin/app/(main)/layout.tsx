import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { AuthUser } from "@/types/auth";
import { AuthGate } from "@/components/global/auth-gate";

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

  void user;

  return (
    <div className="min-h-full">
      <AuthGate>{children}</AuthGate>
    </div>
  );
}
