import { Logo } from "@/components/global/logo";
import { ModeToggle } from "@/components/global/theme-button";
import { FieldDescription } from "@/components/ui/field";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
    </div>
  );
}
