"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogoutButton } from "@/components/global/logout-button";

export default function Home() {
  const { user, isLoading, isAuthenticated, serverUnreachable, logout } =
    useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();

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
          <LogoutButton redirectTo="/" />
        </>
      ) : (
        <div>
          <p>Not logged in</p>
          <Button onClick={() => router.push("/auth/sign-in")}>
            Connexion a votre compte
          </Button>
        </div>
      )}
    </div>
  );
}
