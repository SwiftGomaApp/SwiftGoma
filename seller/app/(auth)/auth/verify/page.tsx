import { VerifyForm } from "@/components/auth/verify-form";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Vérification du compte",
  description: "Vérifiez votre compte vendeur SwiftGoma avec le code reçu.",
};

interface VerifyPageProps {
  searchParams: Promise<{ userId?: string; target?: string }>;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { userId, target } = await searchParams;

  if (!userId || !target) {
    redirect("/auth/sign-up");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="w-full px-6 py-5">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="text-xl" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <VerifyForm userId={userId} target={target} />
        </div>
      </main>

      <footer className="w-full px-6 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SwiftGoma — Goma, RDC
        </p>
      </footer>
    </div>
  );
}
