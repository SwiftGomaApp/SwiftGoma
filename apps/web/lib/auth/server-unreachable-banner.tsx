"use client";

import { useAuth } from "@/lib/auth/auth-context";

export function ServerUnreachableBanner() {
  const { serverUnreachable } = useAuth();

  if (!serverUnreachable) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-primary-foreground text-primary text-sm text-center py-2">
      Can&apos;t reach the server — retrying…
    </div>
  );
}
