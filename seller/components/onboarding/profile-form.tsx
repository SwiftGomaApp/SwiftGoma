"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sellerApi } from "@/lib/api/seller-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { Store, Camera } from "lucide-react";

export function ProfileForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [commune, setCommune] = useState("");
  const [quartier, setQuartier] = useState("");
  const [avenue, setAvenue] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      sellerApi.createProfile({
        shopName,
        description: description || undefined,
        commune,
        quartier,
        avenue: avenue || undefined,
        logo: logo ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller", "profile"] });
      router.push("/");
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative"
          >
            <Avatar className="size-16 rounded-full">
              <AvatarImage src={logoPreview ?? undefined} alt="Logo" />
              <AvatarFallback className="rounded-full bg-primary/10">
                <Store className="size-6 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />

          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">
              Créez votre profil vendeur
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Ces informations seront visibles par vos clients sur SwiftGoma
            </p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor="shopName">Nom de votre activité</FieldLabel>
          <Input
            id="shopName"
            type="text"
            placeholder="Himbi Fashion"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />
          <FieldDescription>
            Le nom de votre entreprise ou activité commerciale
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description (optionnel)</FieldLabel>
          <Textarea
            id="description"
            placeholder="Décrivez votre activité en quelques mots..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="commune">Commune</FieldLabel>
            <Input
              id="commune"
              type="text"
              placeholder="Karisimbi"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="quartier">Quartier</FieldLabel>
            <Input
              id="quartier"
              type="text"
              placeholder="Majengo"
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="avenue">Avenue (optionnel)</FieldLabel>
          <Input
            id="avenue"
            type="text"
            placeholder="Avenue Texa"
            value={avenue}
            onChange={(e) => setAvenue(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Field>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Création en cours..." : "Continuer"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
