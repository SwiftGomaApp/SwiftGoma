// app/(main)/error.tsx
"use client";

import { useEffect } from "react";
import { RotateCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiException } from "@/lib/api/api-exception";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isNetworkError = error instanceof ApiException && error.isNetworkError;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <WifiOff className="h-6 w-6 text-destructive" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          {isNetworkError
            ? "Impossible de contacter le serveur"
            : "Une erreur est survenue"}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isNetworkError
            ? "Vérifiez votre connexion internet, ou réessayez dans quelques instants."
            : "Quelque chose s'est mal passé. Notre équipe a été notifiée."}
        </p>
      </div>

      <Button onClick={() => reset()}>
        <RotateCw className="mr-2 h-4 w-4" />
        Réessayer
      </Button>
    </main>
  );
}
