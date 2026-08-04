"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { authApi } from "@/lib/api/routes/auth";
import { ApiException } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { detectLocale } from "@/lib/locale";

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.createAccount({
        name,
        email,
        role: "BUYER",
        locale: detectLocale(),
      });
      toast.success("Compte créé. Vérifiez votre email pour continuer.");
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    setIsLoading(true);
    try {
      await authApi.registerWithGoogle({
        idToken,
        role: "BUYER",
        locale: detectLocale(),
      });
      await refresh();
      router.push("/");
    } catch (err) {
      toast.error(
        err instanceof ApiException
          ? err.message
          : "Inscription avec Google échouée.",
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Créer un compte
            </h1>
            <p className="text-sm text-muted-foreground">
              Rejoignez Swiftgoma en quelques secondes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom complet"
              className="h-12 pl-10"
              required
            />
          </div>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="h-12 pl-10"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="mt-2 w-full"
          >
            {isLoading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleAuthButton
          onCredential={handleGoogleCredential}
          disabled={isLoading}
          label="Continuer avec Google"
        />

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/auth/sign-in"
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
