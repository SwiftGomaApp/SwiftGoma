"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicCategory } from "@/lib/api/routes/products";
import {
  PRODUCT_SORT_OPTIONS,
  type ProductSortValue,
} from "@/lib/constants/products";
import type { Locale } from "@/lib/language";

export type ProductFilterValues = {
  search: string;
  categoryId: string; // "all" or a category id
  subcategoryId: string; // "all" or a subcategory id (scoped to categoryId)
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sortBy: ProductSortValue;
};

const DEFAULT_VALUES: ProductFilterValues = {
  search: "",
  categoryId: "all",
  subcategoryId: "all",
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
  sortBy: "recent",
};

const DEBOUNCE_MS = 450;

// This dialog can be opened from any page (e.g. the header's global search),
// so it always navigates to the products page to show results rather than
// filtering "in place" on whatever page it happened to be opened from.
const PRODUCTS_PATH = "/products";

const FILTER_STRINGS: Record<
  Locale,
  {
    title: string;
    description: string;
    search: string;
    searchPlaceholder: string;
    category: string;
    allCategories: string;
    subcategory: string;
    allSubcategories: string;
    price: string;
    min: string;
    max: string;
    inStockOnly: string;
    sortBy: string;
    clear: string;
    done: string;
    filtersButton: string;
    updating: string;
    resultsOne: string;
    resultsMany: string;
    searchButton: string;
  }
> = {
  en: {
    title: "Filter products",
    description: "Category, price, and sort apply instantly. Search applies when you submit it.",
    search: "Search",
    searchPlaceholder: "Search by keyword…",
    category: "Category",
    allCategories: "All categories",
    subcategory: "Subcategory",
    allSubcategories: "All",
    price: "Price",
    min: "Min",
    max: "Max",
    inStockOnly: "In stock only",
    sortBy: "Sort by",
    clear: "Clear all",
    done: "Done",
    filtersButton: "Filters",
    updating: "Updating…",
    resultsOne: "result",
    resultsMany: "results",
    searchButton: "Search",
  },
  fr: {
    title: "Filtrer les produits",
    description: "Catégorie, prix et tri s'appliquent instantanément. La recherche s'applique à la soumission.",
    search: "Recherche",
    searchPlaceholder: "Rechercher par mot-clé…",
    category: "Catégorie",
    allCategories: "Toutes les catégories",
    subcategory: "Sous-catégorie",
    allSubcategories: "Toutes",
    price: "Prix",
    min: "Min",
    max: "Max",
    inStockOnly: "En stock uniquement",
    sortBy: "Trier par",
    clear: "Tout effacer",
    done: "Terminé",
    filtersButton: "Filtres",
    updating: "Mise à jour…",
    resultsOne: "résultat",
    resultsMany: "résultats",
    searchButton: "Rechercher",
  },
};

function countActiveFilters(values: ProductFilterValues): number {
  let count = 0;
  if (values.search.trim()) count++;
  if (values.categoryId !== "all") count++;
  if (values.subcategoryId !== "all") count++;
  if (values.minPrice.trim()) count++;
  if (values.maxPrice.trim()) count++;
  if (values.inStockOnly) count++;
  if (values.sortBy !== "recent") count++;
  return count;
}

function buildQueryString(values: ProductFilterValues): string {
  const params = new URLSearchParams();
  if (values.search.trim()) params.set("search", values.search.trim());
  if (values.categoryId !== "all") params.set("categoryId", values.categoryId);
  if (values.subcategoryId !== "all")
    params.set("subcategoryId", values.subcategoryId);
  if (values.minPrice.trim()) params.set("minPrice", values.minPrice.trim());
  if (values.maxPrice.trim()) params.set("maxPrice", values.maxPrice.trim());
  if (values.inStockOnly) params.set("inStockOnly", "true");
  if (values.sortBy !== "recent") params.set("sortBy", values.sortBy);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function ProductFilters({
  categories,
  values = DEFAULT_VALUES,
  resultsCount,
  locale,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
  autoApply = true,
}: {
  categories: PublicCategory[];
  values?: ProductFilterValues;
  /** Omit when the current result count isn't known (e.g. opened from outside the products page). */
  resultsCount?: number;
  locale: Locale;
  /** Pass these two to drive the dialog from an external trigger (e.g. the header's search icon). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Set to false when driving the dialog via `open`/`onOpenChange` from an external trigger button. */
  showTrigger?: boolean;
  /**
   * When true (default, used on the products page itself), each change
   * applies and navigates immediately. When false (e.g. the header's global
   * search), changes only update local state — nothing navigates until the
   * user clicks "Done".
   */
  autoApply?: boolean;
}) {
  const t = FILTER_STRINGS[locale];
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [local, setLocal] = useState<ProductFilterValues>(values);
  const [searchDraft, setSearchDraft] = useState(values.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Other controls (e.g. the hero search bar) can navigate and change the
  // URL independently of this dialog. Re-sync local state whenever the
  // server-derived `values` prop changes so this dialog never shows stale
  // filters after an external navigation.
  useEffect(() => {
    setLocal(values);
    setSearchDraft(values.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const activeCount = useMemo(() => countActiveFilters(local), [local]);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === local.categoryId),
    [categories, local.categoryId],
  );

  function push(next: ProductFilterValues) {
    startTransition(() => {
      router.push(`${PRODUCTS_PATH}${buildQueryString(next)}`, {
        scroll: false,
      });
    });
  }

  function applyNow(patch: Partial<ProductFilterValues>) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const next = { ...local, ...patch };
    setLocal(next);
    if (autoApply) push(next);
  }

  function applyDebounced(patch: Partial<ProductFilterValues>) {
    const next = { ...local, ...patch };
    setLocal(next);
    if (!autoApply) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(next), DEBOUNCE_MS);
  }

  function submitSearch() {
    if (autoApply) {
      applyNow({ search: searchDraft });
    } else {
      setLocal((prev) => ({ ...prev, search: searchDraft }));
    }
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocal(DEFAULT_VALUES);
    setSearchDraft("");
    if (autoApply) push(DEFAULT_VALUES);
  }

  function handleDone() {
    if (!autoApply) {
      push({ ...local, search: searchDraft });
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
          <SlidersHorizontal className="size-4" />
          {t.filtersButton}
          {activeCount > 0 && (
            <Badge className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">
              {activeCount}
            </Badge>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-6">
            <form
              className="flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitSearch();
              }}
            >
              <label
                htmlFor="product-search"
                className="text-sm font-medium text-foreground"
              >
                {t.search}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="product-search"
                  type="search"
                  placeholder={t.searchPlaceholder}
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitSearch();
                    }
                  }}
                />
                <Button type="submit" size="icon" aria-label={t.searchButton}>
                  <Search className="size-4" />
                </Button>
              </div>
            </form>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-foreground">
                {t.price}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={t.min}
                  value={local.minPrice}
                  onChange={(e) =>
                    applyDebounced({ minPrice: e.target.value })
                  }
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  min={0}
                  placeholder={t.max}
                  value={local.maxPrice}
                  onChange={(e) =>
                    applyDebounced({ maxPrice: e.target.value })
                  }
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={local.inStockOnly}
                onCheckedChange={(checked) =>
                  applyNow({ inStockOnly: checked === true })
                }
              />
              {t.inStockOnly}
            </label>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="product-sort"
                className="text-sm font-medium text-foreground"
              >
                {t.sortBy}
              </label>
              <NativeSelect
                id="product-sort"
                value={local.sortBy}
                onChange={(e) =>
                  applyNow({ sortBy: e.target.value as ProductSortValue })
                }
                className="w-full"
              >
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label[locale]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-foreground">
              {t.category}
            </span>
            <RadioGroup
              value={local.categoryId}
              onValueChange={(value) =>
                applyNow({
                  categoryId: value as string,
                  subcategoryId: "all",
                })
              }
              className="max-h-64 gap-2.5 overflow-y-auto rounded-lg border border-border p-3 sm:max-h-48"
            >
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <RadioGroupItem value="all" />
                {t.allCategories}
              </label>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <RadioGroupItem value={category.id} />
                  {category.name}
                </label>
              ))}
            </RadioGroup>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <>
                <span className="text-sm font-medium text-foreground">
                  {t.subcategory}
                </span>
                <RadioGroup
                  value={local.subcategoryId}
                  onValueChange={(value) =>
                    applyNow({ subcategoryId: value as string })
                  }
                  className="max-h-64 gap-2.5 overflow-y-auto rounded-lg border border-border p-3 sm:max-h-48"
                >
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RadioGroupItem value="all" />
                    {t.allSubcategories}
                  </label>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <label
                      key={subcategory.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <RadioGroupItem value={subcategory.id} />
                      {subcategory.name}
                    </label>
                  ))}
                </RadioGroup>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {isPending
              ? t.updating
              : resultsCount !== undefined
                ? `${resultsCount} ${resultsCount === 1 ? t.resultsOne : t.resultsMany}`
                : ""}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearAll}>
              {t.clear}
            </Button>
            <Button onClick={handleDone}>{t.done}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProductFilters;
