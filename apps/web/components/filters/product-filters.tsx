// components/filters/product-filters.tsx
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
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/mock-categories";

const CURRENCIES = ["USD", "CDF"];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "priceAsc", label: "Prix croissant" },
  { value: "priceDesc", label: "Prix décroissant" },
];

type ComboOption = {
  id: string;
  name: string;
};

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
            nativeButton={false}
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

type ProductFiltersProps = {
  onApply?: () => void;
};

export function ProductFilters({ onApply }: ProductFiltersProps) {
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
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStockOnly") === "true",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "recent");

  const subcategories = useMemo(() => {
    if (!categoryId) return [];
    return CATEGORIES.find((c) => c.id === categoryId)?.subcategories ?? [];
  }, [categoryId]);

  const handleCategoryChange = (value: string | null) => {
    setCategoryId(value);
    setSubcategoryId(null); // reset subcategory whenever category changes
  };

  const handleApply = () => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (categoryId) params.set("categoryId", categoryId);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (currency) params.set("currency", currency);
    if (city) params.set("city", city);
    if (inStockOnly) params.set("inStockOnly", "true");
    if (sortBy !== "recent") params.set("sortBy", sortBy);
    params.set("page", "1");

    router.push(`/products?${params.toString()}`);
    onApply?.();
  };

  const handleReset = () => {
    setSearch("");
    setCategoryId(null);
    setSubcategoryId(null);
    setMinPrice("");
    setMaxPrice("");
    setCurrency(null);
    setCity("");
    setInStockOnly(false);
    setSortBy("recent");
    router.push("/products");
    onApply?.();
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader>
        <SheetTitle>Filtrer les produits</SheetTitle>
        <SheetDescription>
          Affinez votre recherche selon vos préférences.
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-search">Recherche</Label>
          <Input
            id="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, description, marque..."
          />
        </div>

        {/* Category — searchable combobox */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-category">Catégorie</Label>
          <SearchableCombobox
            id="filter-category"
            value={categoryId}
            onValueChange={handleCategoryChange}
            options={CATEGORIES}
            placeholder="Toutes les catégories"
            searchPlaceholder="Rechercher une catégorie..."
            emptyLabel="Aucune catégorie trouvée."
          />
        </div>

        {/* Subcategory — searchable combobox, only shown once a category is picked */}
        {categoryId && subcategories.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-subcategory">Sous-catégorie</Label>
            <SearchableCombobox
              id="filter-subcategory"
              value={subcategoryId}
              onValueChange={setSubcategoryId}
              options={subcategories}
              placeholder="Toutes les sous-catégories"
              searchPlaceholder="Rechercher une sous-catégorie..."
              emptyLabel="Aucune sous-catégorie trouvée."
            />
          </div>
        )}

        {/* Price range */}
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

        {/* Currency */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-currency">Devise</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="filter-currency" className="w-full">
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

        {/* City */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-city">Ville</Label>
          <Input
            id="filter-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Goma, Bukavu..."
          />
        </div>

        {/* In stock only */}
        <div className="flex items-center justify-between">
          <Label htmlFor="filter-in-stock" className="cursor-pointer">
            En stock uniquement
          </Label>
          <Switch
            id="filter-in-stock"
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
          />
        </div>

        {/* Sort */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-sort">Trier par</Label>
          <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
            <SelectTrigger id="filter-sort" className="w-full">
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
      </div>

      <SheetFooter className="flex-row gap-2 border-t border-border px-6 py-4">
        <Button variant="outline" onClick={handleReset} className="flex-1">
          Réinitialiser
        </Button>
        <Button onClick={handleApply} className="flex-1">
          Appliquer
        </Button>
      </SheetFooter>
    </div>
  );
}
