// components/server-error-banner.tsx
import { WifiOff } from "lucide-react";

export function ServerErrorBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        Impossible de contacter le serveur. Certaines fonctionnalités peuvent
        être indisponibles.
      </span>
    </div>
  );
}
