"use client";

import type { ReactNode } from "react";
import { FullPageSpinner } from "@/components/global/full-page-spinner";
import { useAuth } from "@/providers/auth-provider";

export function AuthShell({ children }: { children: ReactNode }) {
  const { isLoading, isCompletingLogin } = useAuth();

  if (isLoading || isCompletingLogin) {
    return (
      <FullPageSpinner
        label={isCompletingLogin ? "Connexion en cours…" : "Chargement…"}
      />
    );
  }

  return <>{children}</>;
}
