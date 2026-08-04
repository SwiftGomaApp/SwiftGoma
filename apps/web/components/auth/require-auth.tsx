"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const unauthenticated = !isLoading && !user;

  useEffect(() => {
    if (unauthenticated) {
      router.replace(`/auth/sign-in?next=${encodeURIComponent(pathname)}`);
    }
  }, [unauthenticated, pathname, router]);

  if (unauthenticated) return null;
  return <>{children}</>;
}
