"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { detectLocale } from "@/lib/locale";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email, locale: detectLocale() });
      toast.success("Code envoyé par email.");
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <Logo />

          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Mot de passe oublié ?
            </h1>
            <p className="text-sm text-muted-foreground">
              Entrez votre email pour recevoir un code de réinitialisation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="h-12 pl-10"
              autoFocus
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Envoi..." : "Envoyer le code"}
          </Button>
        </form>

        <Link
          href="/auth/sign-in"
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour à la connexion
        </Link>
      </div>
    </main>
  );
}
