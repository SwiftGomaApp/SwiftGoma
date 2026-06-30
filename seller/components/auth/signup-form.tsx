"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Value as PhoneValue } from "react-phone-number-input";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type IdentifierMethod = "email" | "phone";

export function SignUpForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [method, setMethod] = useState<IdentifierMethod>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const identifier = method === "email" ? email : (phone ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier) {
      setError(
        method === "email"
          ? "Veuillez entrer une adresse e-mail."
          : "Veuillez entrer un numéro de téléphone.",
      );
      return;
    }

    setLoading(true);

    // SIMULATION — replace with real API call:
    // POST /auth/register { name, identifier, role: "SELLER" }
    await wait(800);
    console.log("[SIMULATION] Register request", {
      name,
      identifier,
      role: "SELLER",
    });

    // Real response shape: { userId, type, target }
    const simulatedTarget = identifier;

    setLoading(false);
    router.push(
      `/auth/verify?identifier=${encodeURIComponent(simulatedTarget)}`,
    );
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Créer votre compte</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Commencez à vendre sur SwiftGoma en quelques minutes
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="name">Nom complet</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder="Jean Mukendi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <Field className="gap-3">
          <Tabs
            value={method}
            onValueChange={(v) => setMethod(v as IdentifierMethod)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="email" className="flex-1">
                E-mail
              </TabsTrigger>
              <TabsTrigger value="phone" className="flex-1">
                Téléphone
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {method === "email" ? (
            <Field>
              <FieldLabel htmlFor="email">Adresse e-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
          ) : (
            <Field>
              <FieldLabel htmlFor="phone">Numéro de téléphone</FieldLabel>
              <PhoneInput
                id="phone"
                defaultCountry="CD"
                value={phone}
                onChange={setPhone}
                placeholder="+243 893 456 789"
              />
            </Field>
          )}
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Field>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Création en cours..."
              : "Recevoir le code de vérification"}
          </Button>
        </Field>

        <FieldSeparator>Ou continuer avec</FieldSeparator>

        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            S&apos;inscrire avec Google
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Déjà un compte ?{" "}
          <Link href="/auth/sign-in" className="underline underline-offset-4">
            Se connecter
          </Link>
        </FieldDescription>

        <FieldDescription className="text-center text-xs">
          En créant un compte, vous acceptez notre Politique vendeur.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
