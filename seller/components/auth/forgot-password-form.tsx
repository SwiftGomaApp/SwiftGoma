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
import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // SIMULATION — replace with real API call: forgot-password { identifier }
    await wait(800);
    console.log("[SIMULATION] Password reset link sent to", identifier);

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="size-6 text-primary" />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Vérifiez vos e-mails</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Si un compte existe pour{" "}
            <span className="font-medium text-foreground">{identifier}</span>,
            un lien de réinitialisation a été envoyé.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez rien reçu ?{" "}
          <button
            type="button"
            onClick={handleSubmit}
            className="underline underline-offset-4 hover:text-foreground"
          >
            Renvoyer le lien
          </button>
        </p>

        <Link
          href="/auth/sign-in"
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour à la connexion
        </Link>
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
          <h1 className="text-xl font-semibold">Mot de passe oublié</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Entrez votre e-mail ou téléphone, nous vous enverrons un lien de
            réinitialisation.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="identifier">E-mail ou téléphone</FieldLabel>
          <Input
            id="identifier"
            type="text"
            placeholder="vous@exemple.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </Field>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          <Link
            href="/auth/sign-in"
            className="flex items-center justify-center gap-1 underline underline-offset-4"
          >
            <ArrowLeft className="size-4" />
            Retour à la connexion
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}