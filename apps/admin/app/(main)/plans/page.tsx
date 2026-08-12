"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  listPlans,
  createPlan,
  updatePlanPrice,
  setPlanActive,
  type Plan,
  type BillingCycle,
} from "@/lib/api/routes/plans";
import { getErrorMessage } from "@/lib/get-error-message";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import { billingPeriodLabels, labelOf } from "@/lib/i18n/labels";
import { PlanMetadataDialog } from "@/components/admin/plan-metadata-dialog";

const CYCLES: BillingCycle[] = ["MONTHLY", "YEARLY"];
const CURRENCIES = ["USD", "CDF"];

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function PriceEditor({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setIsSaving(true);
    try {
      await updatePlanPrice(plan.id, {
        billingCycle: cycle,
        currency,
        amount: parsed,
      });
      setAmount("");
      onSaved();
      showSuccessToast(
        "Prix enregistré",
        `Prix ${labelOf(billingPeriodLabels, cycle).toLowerCase()} mis à jour pour ${plan.name}.`,
      );
    } catch (err) {
      showErrorToast(
        "Impossible d'enregistrer le prix",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bg-muted/30 flex flex-wrap items-end gap-2 rounded-lg p-3">
      <NativeSelect
        value={cycle}
        onChange={(e) => setCycle(e.target.value as BillingCycle)}
        className="w-28"
        size="sm"
      >
        {CYCLES.map((c) => (
          <NativeSelectOption key={c} value={c}>
            {labelOf(billingPeriodLabels, c)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="w-24"
        size="sm"
      >
        {CURRENCIES.map((c) => (
          <NativeSelectOption key={c} value={c}>
            {c}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Input
        type="number"
        step="any"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Montant"
        className="h-8 w-28 text-sm"
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isSaving || !amount}
        onClick={handleSave}
      >
        Ajouter / mettre à jour le prix
      </Button>
    </div>
  );
}

const emptyForm = {
  name: "",
  slug: "",
  maxProducts: "10",
  maxPhotosPerProduct: "5",
  maxShops: "1",
  prioritySupport: false,
};

export default function PlansPage() {
  const confirm = useConfirm();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isCreating, setIsCreating] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setPlans(await listPlans(true));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les forfaits."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createPlan({
        name: form.name.trim(),
        slug: form.slug.trim(),
        maxProducts: Number(form.maxProducts),
        maxPhotosPerProduct: Number(form.maxPhotosPerProduct),
        maxShops: Number(form.maxShops),
        prioritySupport: form.prioritySupport,
      });
      setForm(emptyForm);
      setSlugTouched(false);
      setCreateOpen(false);
      await load();
      showSuccessToast(
        "Forfait créé",
        `${form.name.trim()} est prêt — ajoutez des prix ci-dessous.`,
      );
    } catch (err) {
      showErrorToast(
        "Impossible de créer le forfait",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleActive(plan: Plan) {
    const nextActive = !plan.isActive;
    const ok = await confirm({
      title: nextActive ? "Activer le forfait" : "Désactiver le forfait",
      description: nextActive
        ? `Rendre « ${plan.name} » disponible pour de nouveaux abonnements vendeurs ?`
        : `« ${plan.name} » ne sera plus disponible pour de nouveaux abonnements. Les abonnements existants ne sont pas affectés.`,
      confirmLabel: nextActive ? "Activer" : "Désactiver",
      destructive: !nextActive,
    });
    if (!ok) return;

    setBusyId(plan.id);
    try {
      await setPlanActive(plan.id, nextActive);
      await load();
      showSuccessToast(
        nextActive ? "Forfait activé" : "Forfait désactivé",
        plan.name,
      );
    } catch (err) {
      showErrorToast(
        "Échec de la mise à jour",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Forfaits</h1>
          <p className="text-muted-foreground text-sm">
            Niveaux d&apos;abonnement auxquels les vendeurs peuvent souscrire.
            Chaque forfait nécessite au moins un prix mensuel ou annuel avant
            d&apos;être sélectionnable.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouveau forfait
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">
              Aucun forfait pour l&apos;instant.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              Créer votre premier forfait
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  {plan.name}
                  <Badge variant="outline">{plan.slug}</Badge>
                  {!plan.isActive && (
                    <Badge variant="secondary">{ui.inactive}</Badge>
                  )}
                  {plan.prioritySupport && (
                    <Badge variant="outline">Support prioritaire</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditPlan(plan)}
                  >
                    Modifier
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    {plan.isActive ? ui.active : ui.inactive}
                  </span>
                  <Switch
                    checked={plan.isActive}
                    disabled={busyId === plan.id}
                    onCheckedChange={() => toggleActive(plan)}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 border-t pt-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Produits</p>
                    <p className="font-semibold">{plan.maxProducts} max</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">
                      Photos par produit
                    </p>
                    <p className="font-semibold">
                      {plan.maxPhotosPerProduct} max
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Boutiques</p>
                    <p className="font-semibold">{plan.maxShops} max</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-medium">Prix actuels</p>
                  {plan.prices.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {plan.prices.map((price) => (
                        <Badge key={price.id} variant="outline">
                          {labelOf(billingPeriodLabels, price.billingCycle)} ·{" "}
                          {price.amount} {price.currency}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Aucun prix pour l&apos;instant — ajoutez-en un ci-dessous
                      pour que les vendeurs puissent s&apos;abonner.
                    </p>
                  )}
                </div>

                <PriceEditor plan={plan} onSaved={load} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanMetadataDialog
        plan={editPlan}
        onOpenChange={(open) => {
          if (!open) setEditPlan(null);
        }}
        onSaved={load}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un forfait d&apos;abonnement</DialogTitle>
            <DialogDescription>
              Définissez ce que les vendeurs obtiennent avec ce niveau. Vous
              pourrez ajouter des prix mensuels et annuels après la création.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <FieldGroup className="gap-4 py-2">
              <Field>
                <FieldLabel>Nom du forfait</FieldLabel>
                <Input
                  placeholder="ex. Starter, Pro, Enterprise"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: slugTouched ? f.slug : slugify(name),
                    }));
                  }}
                  required
                />
                <FieldDescription>
                  Affiché aux vendeurs dans l&apos;application.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Identifiant (slug)</FieldLabel>
                <Input
                  placeholder="starter"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                  required
                />
                <FieldDescription>
                  Identifiant compatible URL — généré automatiquement à partir
                  du nom.
                </FieldDescription>
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel>Produits max</FieldLabel>
                  <Input
                    type="number"
                    value={form.maxProducts}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxProducts: e.target.value }))
                    }
                    min={1}
                  />
                </Field>
                <Field>
                  <FieldLabel>Photos max / produit</FieldLabel>
                  <Input
                    type="number"
                    value={form.maxPhotosPerProduct}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxPhotosPerProduct: e.target.value,
                      }))
                    }
                    min={1}
                  />
                </Field>
                <Field>
                  <FieldLabel>Boutiques max</FieldLabel>
                  <Input
                    type="number"
                    value={form.maxShops}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxShops: e.target.value }))
                    }
                    min={1}
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
                    Les vendeurs sur ce forfait bénéficient de délais de réponse
                    plus courts.
                  </FieldDescription>
                </div>
              </Field>
            </FieldGroup>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {ui.cancel}
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Création…" : "Créer le forfait"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
