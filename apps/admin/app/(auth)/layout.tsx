import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { getDashboardPath } from "@/lib/get-dashboard-path";
import type { AuthUser } from "@/types/auth";
import { ConnectionErrorBanner } from "@/components/global/connection-error-banner";
import { Logo } from "@/components/global/logo";
import { ModeToggle } from "@/components/global/theme-button";
import { AuthShell } from "@/components/global/auth-shell";
import { FieldDescription } from "@/components/ui/field";

async function redirectIfAuthenticated(): Promise<void> {
  try {
    const user = (await getMeServer()) as AuthUser;
    redirect(getDashboardPath(user.role));
  } catch {
    // not signed in — show auth pages
  }
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await redirectIfAuthenticated();

  return (
    <AuthShell>
      <div className="relative flex h-svh flex-col overflow-hidden bg-background">
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>

        <div className="flex justify-center pt-8">
          <Logo />
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
          {children}
        </div>

        <FieldDescription className="px-6 pb-6 text-center text-xs">
          En cliquant sur continuer, vous acceptez nos{" "}
          <a href="https://swiftgoma.com/legal/terms" target="_blank">
            Conditions d'utilisation
          </a>{" "}
          et notre{" "}
          <a href="https://swiftgoma.com/legal/privacy" target="_blank">
            Politique de confidentialité
          </a>
          .
        </FieldDescription>

        <ConnectionErrorBanner />
      </div>
    </AuthShell>
  );
}
