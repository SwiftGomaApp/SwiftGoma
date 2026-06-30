"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ResetPasswordFormProps extends React.ComponentProps<"form"> {
  token: string;
}

export function ResetPasswordForm({
  className,
  token,
  ...props
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    // SIMULATION — replace with real API call: reset-password { token, password }
    await wait(800);
    console.log("[SIMULATION] Password reset with token", token);

    setDone(true);
    setLoading(false);

    // Auto-redirect to sign-in after a moment
    setTimeout(() => router.push("/auth/sign-in"), 2000);
  };

  if (done) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-6 text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Mot de passe mis à jour</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Vous allez être redirigé vers la page de connexion...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-sm text-balance text-muted-foreground">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="password">Nouveau mot de passe</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">
            Confirmer le mot de passe
          </FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          <Link href="/auth/sign-in" className="underline underline-offset-4">
            Retour à la connexion
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
