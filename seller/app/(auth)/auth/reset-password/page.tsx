import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthCarousel } from "@/components/auth/auth-carousel";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe",
  description:
    "Choisissez un nouveau mot de passe pour votre compte vendeur SwiftGoma.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/auth/forgot-password");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link href="/" className="inline-flex w-fit">
          <Logo className="text-xl" />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <ResetPasswordForm token={token} />
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
