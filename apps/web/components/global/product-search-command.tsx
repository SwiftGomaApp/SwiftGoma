"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import ProductCard, { ProductCardImage } from "./product-card";

export interface SearchProduct {
  id: string;
  slug?: string;
  images: ProductCardImage[];
  category: string;
  name: string;
  price: number;
  originalPrice?: number;
  currency?: string;
}

interface ProductSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: SearchProduct[];
  /** Shown when the input is empty. Defaults to the first 4 products. */
  suggestions?: SearchProduct[];
  onAddToCart?: (product: SearchProduct) => void;
  onFavoriteToggle?: (product: SearchProduct, next: boolean) => void;
}

export function ProductSearchCommand({
  open,
  onOpenChange,
  products,
  suggestions,
  onAddToCart,
  onFavoriteToggle,
}: ProductSearchCommandProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // Reset the query each time the dialog is closed/reopened
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Cmd+K / Ctrl+K to open from anywhere
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const defaultSuggestions = suggestions ?? products.slice(0, 4);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [products, query]);

  const showingSuggestions = query.trim().length === 0;
  const listToRender = showingSuggestions ? defaultSuggestions : results;

  function handleSelect(product: SearchProduct) {
    onOpenChange(false);
    router.push(`/products/${product.slug ?? product.id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search products"
      description="Search for a product by name or category"
      className="max-w-xl"
    >
      <CommandInput
        placeholder="Search products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No products found.</CommandEmpty>

        {listToRender.length > 0 && (
          <CommandGroup
            heading={showingSuggestions ? "Suggestions" : "Results"}
          >
            {listToRender.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.category}`}
                onSelect={() => handleSelect(product)}
                className="rounded-2xl p-0 aria-selected:bg-accent/40 data-[selected=true]:bg-accent/40"
              >
                <ProductCard
                  images={product.images}
                  category={product.category}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  currency={product.currency}
                  orientation="horizontal"
                  className="max-w-none ring-0 shadow-none"
                  onAddToCart={() => onAddToCart?.(product)}
                  onFavoriteToggle={(next) => onFavoriteToggle?.(product, next)}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default ProductSearchCommand;
