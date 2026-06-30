import { LoginForm } from "@/components/auth/login-form";
import { AuthCarousel } from "@/components/auth/auth-carousel";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace vendeur SwiftGoma pour gérer votre boutique, vos produits et vos commandes.",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link href="/" className="inline-flex w-fit">
          <Logo className="text-xl" />
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SwiftGoma — Goma, RDC ·{" "}
          <Link
            href="https://swiftgoma.com/legal/seller"
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
          >
            Politique vendeur
          </Link>
        </p>
      </div>

      <div className="relative hidden lg:block">
        <AuthCarousel />
      </div>
    </div>
  );
}
