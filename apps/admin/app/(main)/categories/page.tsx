"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  Layers,
  Plus,
  Search,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  listCategories,
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  type Category,
} from "@/lib/api/routes/catalog";
import { getErrorMessage } from "@/lib/get-error-message";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FolderTree;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="text-muted-foreground size-5" />
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SubcategoryRow({
  subcategory,
  onToggle,
  isBusy,
}: {
  subcategory: Category["subcategories"][number];
  onToggle: () => void;
  isBusy: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
        subcategory.isActive ? "bg-background" : "bg-muted/40 opacity-80",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Tag className="text-muted-foreground size-3.5 shrink-0" />
        <span
          className={cn(
            "truncate text-sm font-medium",
            !subcategory.isActive && "text-muted-foreground line-through",
          )}
        >
          {subcategory.name}
        </span>
        {!subcategory.isActive && (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {ui.inactive}
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground hidden text-xs sm:inline">
          {ui.active}
        </span>
        <Switch
          checked={subcategory.isActive}
          disabled={isBusy}
          onCheckedChange={onToggle}
          aria-label={`Activer ou désactiver ${subcategory.name}`}
        />
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  busyId,
  subInput,
  isAddingSub,
  onToggleCategory,
  onToggleSubcategory,
  onSubInputChange,
  onAddSubcategory,
}: {
  category: Category;
  busyId: string | null;
  subInput: string;
  isAddingSub: boolean;
  onToggleCategory: () => void;
  onToggleSubcategory: (sub: Category["subcategories"][number]) => void;
  onSubInputChange: (value: string) => void;
  onAddSubcategory: () => void;
}) {
  const activeSubs = category.subcategories.filter((s) => s.isActive).length;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-shadow hover:shadow-md",
        !category.isActive && "opacity-90",
      )}
    >
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{category.name}</CardTitle>
              {!category.isActive && (
                <Badge variant="secondary">{ui.inactive}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {category.subcategories.length === 0
                ? "Aucune sous-catégorie"
                : `${activeSubs} actives · ${category.subcategories.length} au total`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-muted-foreground text-xs">{ui.active}</span>
            <Switch
              checked={category.isActive}
              disabled={busyId === category.id}
              onCheckedChange={onToggleCategory}
              aria-label={`Activer ou désactiver ${category.name}`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {category.subcategories.length === 0 ? (
          <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center">
            <Tag className="text-muted-foreground mb-2 size-5" />
            <p className="text-muted-foreground text-sm">
              Aucune sous-catégorie dans cette catégorie pour l&apos;instant.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {category.subcategories.map((sub) => (
              <SubcategoryRow
                key={sub.id}
                subcategory={sub}
                isBusy={busyId === sub.id}
                onToggle={() => onToggleSubcategory(sub)}
              />
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAddSubcategory();
          }}
          className="bg-muted/30 flex gap-2 rounded-lg border p-2"
        >
          <Input
            value={subInput}
            onChange={(e) => onSubInputChange(e.target.value)}
            placeholder="Ajouter une sous-catégorie…"
            className="h-9 border-0 bg-background shadow-none"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="shrink-0"
            disabled={isAddingSub || !subInput.trim()}
          >
            <Plus className="size-4" />
            Ajouter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const confirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [subInputs, setSubInputs] = useState<Record<string, string>>({});
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);

  const stats = useMemo(() => {
    const subcategories = categories.flatMap((c) => c.subcategories);
    return {
      categories: categories.length,
      activeCategories: categories.filter((c) => c.isActive).length,
      subcategories: subcategories.length,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) => {
      if (category.name.toLowerCase().includes(query)) return true;
      return category.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(query),
      );
    });
  }, [categories, search]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      setCategories(await listCategories(true));
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les catégories."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
  }, []);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      await createCategory({ name: newCategoryName.trim() });
      const name = newCategoryName.trim();
      setNewCategoryName("");
      setCreateOpen(false);
      await load();
      showSuccessToast(
        "Catégorie créée",
        `"${name}" est prête — ajoutez des sous-catégories ci-dessous.`,
      );
    } catch (err) {
      showErrorToast(
        "Impossible de créer la catégorie",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setIsCreatingCategory(false);
    }
  }

  async function toggleCategoryActive(category: Category) {
    const nextActive = !category.isActive;
    const ok = await confirm({
      title: nextActive ? "Activer la catégorie" : "Désactiver la catégorie",
      description: nextActive
        ? `Rendre « ${category.name} » à nouveau visible dans le catalogue ?`
        : `« ${category.name} » et ses sous-catégories seront masquées des nouvelles fiches produit.`,
      confirmLabel: nextActive ? "Activer" : "Désactiver",
      destructive: !nextActive,
    });
    if (!ok) return;

    setBusyId(category.id);
    try {
      await updateCategory(category.id, { isActive: nextActive });
      await load();
      showSuccessToast(
        nextActive ? "Catégorie activée" : "Catégorie désactivée",
        category.name,
      );
    } catch (err) {
      showErrorToast("Échec de la mise à jour", getErrorMessage(err, "Réessayez."));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleSubcategoryActive(sub: Category["subcategories"][number]) {
    const nextActive = !sub.isActive;
    if (!nextActive) {
      const ok = await confirm({
        title: "Désactiver la sous-catégorie",
        description: `« ${sub.name} » n'apparaîtra plus lorsque les vendeurs publient des produits.`,
        confirmLabel: "Désactiver",
        destructive: true,
      });
      if (!ok) return;
    }

    setBusyId(sub.id);
    try {
      await updateSubcategory(sub.id, { isActive: nextActive });
      await load();
      showSuccessToast(
        nextActive ? "Sous-catégorie activée" : "Sous-catégorie désactivée",
        sub.name,
      );
    } catch (err) {
      showErrorToast("Échec de la mise à jour", getErrorMessage(err, "Réessayez."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddSubcategory(categoryId: string) {
    const name = (subInputs[categoryId] ?? "").trim();
    if (!name) return;
    setAddingSubFor(categoryId);
    try {
      await createSubcategory(categoryId, { name });
      setSubInputs((prev) => ({ ...prev, [categoryId]: "" }));
      await load();
      showSuccessToast("Sous-catégorie ajoutée", name);
    } catch (err) {
      showErrorToast(
        "Impossible d'ajouter la sous-catégorie",
        getErrorMessage(err, "Réessayez."),
      );
    } finally {
      setAddingSubFor(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Catégories</h1>
          <p className="text-muted-foreground text-sm">
            Organisez le catalogue produits — les catégories regroupent les
            sous-catégories que les vendeurs choisissent lors de la mise en
            ligne.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Nouvelle catégorie
        </Button>
      </div>

      {!isLoading && !error && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Catégories" value={stats.categories} icon={FolderTree} />
          <StatCard label={ui.active} value={stats.activeCategories} icon={Layers} />
          <StatCard label="Sous-catégories" value={stats.subcategories} icon={Tag} />
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une catégorie ou sous-catégorie…"
          className="pl-9"
        />
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="text-muted-foreground mb-3 size-10" />
            <p className="font-medium">
              {search.trim() ? "Aucune catégorie correspondante" : "Aucune catégorie pour l'instant"}
            </p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              {search.trim()
                ? "Essayez un autre terme de recherche."
                : "Créez votre première catégorie pour commencer à structurer le catalogue."}
            </p>
            {!search.trim() && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Nouvelle catégorie
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              busyId={busyId}
              subInput={subInputs[category.id] ?? ""}
              isAddingSub={addingSubFor === category.id}
              onToggleCategory={() => toggleCategoryActive(category)}
              onToggleSubcategory={toggleSubcategoryActive}
              onSubInputChange={(value) =>
                setSubInputs((prev) => ({ ...prev, [category.id]: value }))
              }
              onAddSubcategory={() => handleAddSubcategory(category.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
            <DialogDescription>
              Les catégories sont des groupes de premier niveau. Vous pourrez
              ajouter des sous-catégories après la création.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="category-name">{ui.name}</FieldLabel>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="ex. Électronique"
                  autoFocus
                />
                <FieldDescription>
                  Affiché aux vendeurs lorsqu&apos;ils catégorisent un produit.
                </FieldDescription>
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
              <Button
                type="submit"
                disabled={isCreatingCategory || !newCategoryName.trim()}
              >
                Créer la catégorie
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
