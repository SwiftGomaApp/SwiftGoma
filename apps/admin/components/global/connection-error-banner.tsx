"use client";

import { useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function ConnectionErrorBanner() {
  const { connectionError, refetchUser } = useAuth();
  const [isRetrying, setIsRetrying] = useState(false);

  if (!connectionError) return null;

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetchUser();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="bg-destructive/10 text-destructive flex items-center justify-center gap-2 px-4 py-2 text-sm">
      <WifiOff className="size-4 shrink-0" />
      <span>Can&apos;t reach the server right now.</span>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-destructive h-auto p-0 underline"
        onClick={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? "Retrying..." : "Retry"}
      </Button>
    </div>
  );
}
