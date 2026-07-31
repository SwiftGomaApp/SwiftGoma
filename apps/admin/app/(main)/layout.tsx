import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { AuthUser } from "@/types/auth";
import { AuthGate } from "@/components/global/auth-gate";
import { AppSidebar } from "@/components/global/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        
        <div className="flex flex-1 flex-col gap-4 p-4">
          <AuthGate>{children}</AuthGate>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
