import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthCarousel } from "@/components/auth/auth-carousel";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié",
  description:
    "Réinitialisez le mot de passe de votre compte vendeur SwiftGoma.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link href="/" className="inline-flex w-fit">
          <Logo className="text-xl" />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ForgotPasswordForm />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SwiftGoma — Goma, RDC
        </p>
      </div>

      <div className="relative hidden lg:block">
        <AuthCarousel />
      </div>
    </div>
  );
}
