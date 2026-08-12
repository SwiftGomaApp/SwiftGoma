"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { updatePlan, type Plan } from "@/lib/api/routes/plans";
import { getErrorMessage } from "@/lib/get-error-message";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";

interface PlanMetadataDialogProps {
  plan: Plan | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function PlanMetadataDialog({
  plan,
  onOpenChange,
  onSaved,
}: PlanMetadataDialogProps) {
  const [form, setForm] = useState({
    name: "",
    maxProducts: "10",
    maxPhotosPerProduct: "5",
    maxShops: "1",
    prioritySupport: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setForm({
      name: plan.name,
      maxProducts: String(plan.maxProducts),
      maxPhotosPerProduct: String(plan.maxPhotosPerProduct),
      maxShops: String(plan.maxShops),
      prioritySupport: plan.prioritySupport,
    });
  }, [plan]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;

    setIsSaving(true);
    try {
      await updatePlan(plan.id, {
        name: form.name.trim(),
        maxProducts: Number(form.maxProducts),
        maxPhotosPerProduct: Number(form.maxPhotosPerProduct),
        maxShops: Number(form.maxShops),
        prioritySupport: form.prioritySupport,
      });
      onOpenChange(false);
      onSaved();
      showSuccessToast("Forfait mis à jour", plan.name);
    } catch (err) {
      showErrorToast(
        "Échec",
        getErrorMessage(err, "Impossible de mettre à jour."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={plan !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le forfait</DialogTitle>
          <DialogDescription>
            {plan ? `${plan.name} (${plan.slug})` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4 py-2">
            <Field>
              <FieldLabel>Nom</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel>Produits max</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.maxProducts}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxProducts: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Photos max / produit</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.maxPhotosPerProduct}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxPhotosPerProduct: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Boutiques max</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.maxShops}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxShops: e.target.value }))
                  }
                />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Switch
                checked={form.prioritySupport}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, prioritySupport: checked }))
                }
              />
              <div>
                <FieldLabel>Support prioritaire</FieldLabel>
                <FieldDescription>
                  Délais de réponse plus courts pour les vendeurs sur ce
                  forfait.
                </FieldDescription>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {ui.cancel}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement…" : ui.apply}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
