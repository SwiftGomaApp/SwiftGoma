"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAuth } from "@/lib/auth/auth-context";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_LOCALE, getClientLocale, type Locale } from "@/lib/language";

const STRINGS: Record<Locale, { loggingOut: string }> = {
  en: { loggingOut: "Logging out…" },
  fr: { loggingOut: "Déconnexion en cours…" },
};

export function LogoutOverlay() {
  const { isLoggingOut } = useAuth();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocale(getClientLocale());
    setMounted(true);
  }, []);

  if (!mounted || !isLoggingOut) return null;

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
    >
      <Spinner className="size-8" />
      <p className="text-sm font-medium text-muted-foreground">
        {STRINGS[locale].loggingOut}
      </p>
    </div>,
    document.body,
  );
}

export default LogoutOverlay;
