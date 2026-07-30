"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/providers/auth-provider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
