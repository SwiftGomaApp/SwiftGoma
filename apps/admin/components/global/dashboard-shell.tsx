"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/global/app-sidebar";
import { AdminHeader } from "@/components/global/admin-header";
import { FullPageSpinner } from "@/components/global/full-page-spinner";
import { useAuth } from "@/providers/auth-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isLoading, isCompletingLogin } = useAuth();

  if (isLoading || isCompletingLogin) {
    return (
      <FullPageSpinner
        label={isCompletingLogin ? "Connexion en cours…" : "Chargement…"}
      />
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
