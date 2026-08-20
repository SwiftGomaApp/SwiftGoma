"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";
import type { VariantProps } from "class-variance-authority";

const STRINGS = {
  en: {
    logOut: "Log out",
    loggingOut: "Logging out…",
  },
  fr: {
    logOut: "Déconnexion",
    loggingOut: "Déconnexion en cours…",
  },
} as const satisfies Record<Locale, Record<string, string>>;

type LogoutButtonProps = {
  redirectTo?: string;
  label?: string | null;
  className?: string;
} & VariantProps<typeof buttonVariants>;

function LogoutOverlay({ locale }: { locale: Locale }) {
  if (typeof document === "undefined") return null;
  const t = STRINGS[locale];

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm"
    >
      <Spinner className="size-8" />
      <p className="text-sm font-medium text-muted-foreground">
        {t.loggingOut}
      </p>
    </div>,
    document.body,
  );
}

export function LogoutButton({
  redirectTo = "/auth/sign-in",
  label,
  variant = "ghost",
  size = "default",
  className,
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];
  const resolvedLabel = label === undefined ? t.logOut : label;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      router.push(redirectTo);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={resolvedLabel ? size : "icon"}
        className={cn("gap-1.5", className)}
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label={resolvedLabel ? undefined : t.logOut}
      >
        <LogOut className="size-4" />
        {resolvedLabel}
      </Button>

      {isLoggingOut && <LogoutOverlay locale={locale} />}
    </>
  );
}
