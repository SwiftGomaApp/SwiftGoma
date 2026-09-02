"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";
import type { VariantProps } from "class-variance-authority";

const STRINGS = {
  en: { logOut: "Log out" },
  fr: { logOut: "Déconnexion" },
} as const satisfies Record<Locale, Record<string, string>>;

type LogoutButtonProps = {
  redirectTo?: string;
  label?: string | null;
  className?: string;
} & VariantProps<typeof buttonVariants>;

export function LogoutButton({
  redirectTo = "/auth/sign-in",
  label,
  variant = "ghost",
  size = "default",
  className,
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useAuth();
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = STRINGS[locale];
  const resolvedLabel = label === undefined ? t.logOut : label;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    await logout();
    router.push(redirectTo);
  };

  return (
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
  );
}
