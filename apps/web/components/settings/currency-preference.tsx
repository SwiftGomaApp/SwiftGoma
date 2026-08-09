"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/providers/auth-provider";
import { userApi } from "@/lib/api/routes/user";
import { ApiException } from "@/lib/api";

const CURRENCIES = [
  { value: "USD", label: "Dollar américain (USD)" },
  { value: "CDF", label: "Franc congolais (CDF)" },
] as const;

export function CurrencyPreference() {
  const { user, refresh } = useAuth();
  const [selected, setSelected] = useState<"USD" | "CDF">(
    user?.preferredCurrency ?? "USD",
  );
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = selected !== (user?.preferredCurrency ?? "USD");

  async function handleSave() {
    setIsSaving(true);
    try {
      await userApi.updateProfile({ preferredCurrency: selected });
      await refresh();
      toast.success("Devise préférée mise à jour.");
    } catch (err) {
      toast.error(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Devise</h3>
        <p className="text-sm text-muted-foreground">
          Choisissez la devise utilisée pour afficher les prix et votre
          panier. Les montants sont convertis automatiquement.
        </p>
      </div>

      <RadioGroup
        value={selected}
        onValueChange={(v) => setSelected(v as "USD" | "CDF")}
        className="grid-cols-1 sm:grid-cols-2"
      >
        {CURRENCIES.map((c) => (
          <label
            key={c.value}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm text-foreground"
          >
            <RadioGroupItem value={c.value} />
            {c.label}
          </label>
        ))}
      </RadioGroup>

      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button onClick={handleSave} disabled={!isDirty || isSaving}>
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
