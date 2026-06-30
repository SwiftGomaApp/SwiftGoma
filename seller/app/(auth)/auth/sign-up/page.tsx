import { SignUpForm } from "@/components/auth/signup-form";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte vendeur SwiftGoma et commencez à vendre.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full px-6 py-5">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="text-xl" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </main>

      <footer className="w-full px-6 py-5">
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
      </footer>
    </div>
  );
}
