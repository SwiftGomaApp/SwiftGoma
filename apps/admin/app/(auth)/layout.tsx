import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/routes/auth.server";
import { ConnectionErrorBanner } from "@/components/global/connection-error-banner";
import { Logo } from "@/components/global/logo";
import { ModeToggle } from "@/components/global/theme-button";
import { AuthGate } from "@/components/global/auth-gate";
import { FieldDescription } from "@/components/ui/field";

async function hasActiveSession(): Promise<boolean> {
  try {
    await getMeServer();
    return true;
  } catch {
    return false;
  }
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (await hasActiveSession()) {
    redirect("/user");
  }

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>

      <div className="flex justify-center pt-8">
        <Logo />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        <AuthGate>{children}</AuthGate>
      </div>

      <FieldDescription className="px-6 pb-6 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <a href="https://swiftgoma.com/legal/terms" target="_blank">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="https://swiftgoma.com/legal/policy" target="_blank">
          Privacy Policy
        </a>
        .
      </FieldDescription>

      <ConnectionErrorBanner />
    </div>
  );
}
