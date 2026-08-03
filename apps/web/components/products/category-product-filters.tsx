"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

const CURRENCIES = ["USD", "CDF"];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "priceAsc", label: "Prix croissant" },
  { value: "priceDesc", label: "Prix décroissant" },
];

type CategoryProductFiltersProps = {
  categorySlug: string;
};

export function CategoryProductFilters({
  categorySlug,
}: CategoryProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
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

  const subcategoryId = searchParams.get("subcategoryId");

  function handleApply() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (currency) params.set("currency", currency);
    if (city) params.set("city", city);
    if (inStockOnly) params.set("inStockOnly", "true");
    if (sortBy !== "recent") params.set("sortBy", sortBy);

    router.push(`/categories/${categorySlug}?${params.toString()}`);
  }

  function handleReset() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setCurrency(null);
    setCity("");
    setInStockOnly(false);
    setSortBy("recent");

    const params = new URLSearchParams();
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    router.push(
      `/categories/${categorySlug}${params.toString() ? `?${params}` : ""}`,
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Filtrer</h2>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-filter-search">Recherche</Label>
        <Input
          id="cat-filter-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Dans cette catégorie..."
        />
      </div>

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
        <Label htmlFor="cat-filter-currency">Devise</Label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="cat-filter-currency" className="w-full">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-filter-city">Ville</Label>
        <Input
          id="cat-filter-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Goma, Bukavu..."
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="cat-filter-in-stock" className="cursor-pointer">
          En stock uniquement
        </Label>
        <Switch
          id="cat-filter-in-stock"
          checked={inStockOnly}
          onCheckedChange={setInStockOnly}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cat-filter-sort">Trier par</Label>
        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger id="cat-filter-sort" className="w-full">
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
