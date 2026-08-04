"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/mock-categories";

const CURRENCIES = ["USD", "CDF"];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "priceAsc", label: "Prix croissant" },
  { value: "priceDesc", label: "Prix décroissant" },
];

type ComboOption = { id: string; name: string };

function SearchableCombobox({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  disabled,
}: {
  id: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: ComboOption[];
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => {
                    onValueChange(option.id === value ? null : option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type ShopProductFiltersProps = {
  shopSlug: string;
};

export function ShopProductFilters({ shopSlug }: ShopProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    searchParams.get("categoryId"),
  );
  const [subcategoryId, setSubcategoryId] = useState<string | null>(
    searchParams.get("subcategoryId"),
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [currency, setCurrency] = useState<string | null>(
    searchParams.get("currency"),
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStockOnly") === "true",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "recent");

  const subcategories = useMemo(() => {
    if (!categoryId) return [];
    return CATEGORIES.find((c) => c.id === categoryId)?.subcategories ?? [];
  }, [categoryId]);

  function handleCategoryChange(value: string | null) {
    setCategoryId(value);
    setSubcategoryId(null);
  }

  function handleApply() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (currency) params.set("currency", currency);
    if (inStockOnly) params.set("inStockOnly", "true");
    if (sortBy !== "recent") params.set("sortBy", sortBy);

    router.push(`/shops/${shopSlug}?${params.toString()}`);
  }

  function handleReset() {
    setSearch("");
    setCategoryId(null);
    setSubcategoryId(null);
    setMinPrice("");
    setMaxPrice("");
    setCurrency(null);
    setInStockOnly(false);
    setSortBy("recent");
    router.push(`/shops/${shopSlug}`);
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Filtrer</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-filter-search">Recherche</Label>
        <Input
          id="shop-filter-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Dans cette boutique..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-filter-category">Catégorie</Label>
        <SearchableCombobox
          id="shop-filter-category"
          value={categoryId}
          onValueChange={handleCategoryChange}
          options={CATEGORIES}
          placeholder="Toutes les catégories"
          searchPlaceholder="Rechercher une catégorie..."
          emptyLabel="Aucune catégorie trouvée."
        />
      </div>

      {categoryId && subcategories.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shop-filter-subcategory">Sous-catégorie</Label>
          <SearchableCombobox
            id="shop-filter-subcategory"
            value={subcategoryId}
            onValueChange={setSubcategoryId}
            options={subcategories}
            placeholder="Toutes les sous-catégories"
            searchPlaceholder="Rechercher une sous-catégorie..."
            emptyLabel="Aucune sous-catégorie trouvée."
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Fourchette de prix</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
          />
          <span className="text-sm text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-filter-currency">Devise</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="shop-filter-currency" className="w-full">
            <SelectValue placeholder="Toutes les devises" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="shop-filter-in-stock" className="cursor-pointer">
          En stock uniquement
        </Label>
        <Switch
          id="shop-filter-in-stock"
          checked={inStockOnly}
          onCheckedChange={setInStockOnly}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shop-filter-sort">Trier par</Label>
        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger id="shop-filter-sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={handleReset} className="flex-1">
          Réinitialiser
        </Button>
        <Button onClick={handleApply} className="flex-1">
          Appliquer
        </Button>
      </div>
    </div>
  );
}
