"use client";

import { useAuth } from "@/lib/auth/auth-context";

export default function Home() {
  const { user, isLoading, isAuthenticated, serverUnreachable } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-2">
      {serverUnreachable ? (
        <p>Can&apos;t reach the server…</p>
      ) : isAuthenticated ? (
        <>
          <p className="text-lg font-semibold">Logged in as {user?.name}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
