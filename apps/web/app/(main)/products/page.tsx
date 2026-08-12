import Link from "next/link";
import { publicApi } from "@/lib/api/routes/public";
import { classifyApiError, type ApiStatus } from "@/lib/api/classify-error";
import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
// import { ApiStatusBanner } from "@/components/global/api-status-banner";
import { ProductSearchBar } from "@/components/products/product-search-bar";
import { ProductsEmptyState } from "@/components/products/empty-state";
import { SearchTransitionProvider } from "@/components/products/search-transition-context";
import { ProductGridStatus } from "@/components/products/product-grid-status";
import { InfiniteProductGrid } from "@/components/products/infinite-product-grid";
import { CATEGORIES } from "@/lib/mock-categories";
import { cn } from "@/lib/utils";

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    shopId?: string;
    minPrice?: string;
    maxPrice?: string;
    currency?: string;
    city?: string;
    inStockOnly?: string;
    sortBy?: string;
    page?: string;
  }>;
};

export const metadata: Metadata = buildPageMetadata({
  title: "Produits",
  description:
    "Parcourez les produits disponibles sur SwiftGoma — marketplace en ligne avec livraison rapide en RDC et au Rwanda.",
  path: "/products",
});

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;

  const listParams = {
    search: params.search,
    categoryId: params.categoryId,
    subcategoryId: params.subcategoryId,
    shopId: params.shopId,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    currency: params.currency as "USD" | "CDF" | undefined,
    city: params.city,
    inStockOnly: params.inStockOnly === "true",
    sortBy: params.sortBy as "recent" | "priceAsc" | "priceDesc" | undefined,
    page: params.page ? Number(params.page) : undefined,
  };

  let products: Awaited<ReturnType<typeof publicApi.listProducts>>["products"] =
    [];
  let pagination:
    | Awaited<ReturnType<typeof publicApi.listProducts>>["pagination"]
    | null = null;
  let status: ApiStatus = null;

  try {
    const result = await publicApi.listProducts(listParams);
    products = result.products;
    pagination = result.pagination;
  } catch (err) {
    status = classifyApiError(err);
    console.warn(
      "[ProductsPage] Failed to load products:",
      (err as Error).message,
    );
  }

  let categories: Awaited<ReturnType<typeof publicApi.listCategories>> =
    CATEGORIES;
  try {
    categories = await publicApi.listCategories();
  } catch (err) {
    console.warn(
      "[ProductsPage] Failed to load categories, using fallback:",
      (err as Error).message,
    );
  }

  const selectedCategory = categories.find((c) => c.id === params.categoryId);
  const selectedSubcategory = selectedCategory?.subcategories.find(
    (s) => s.id === params.subcategoryId,
  );
  const searchScopeLabel = selectedSubcategory?.name ?? selectedCategory?.name;

  const hasActiveFilters = Object.entries(params).some(
    ([key, value]) => value && key !== "page",
  );

  function filterHref(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && !(key in overrides) && key !== "page") next.set(key, value);
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) next.set(key, value);
    }
    return `/products?${next.toString()}`;
  }

  return (
    <SearchTransitionProvider>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        {/* {status && <ApiStatusBanner status={status} />} */}

        <ProductSearchBar
          placeholder={
            searchScopeLabel
              ? `Rechercher dans ${searchScopeLabel}...`
              : "Rechercher un produit..."
          }
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Sidebar — categories & subcategories */}
          <aside className="shrink-0 lg:sticky lg:top-24 lg:w-64">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Catégories
            </h2>
            <nav>
              <ul className="flex flex-col gap-0.5">
                <li>
                  <Link
                    href="/products"
                    className={cn(
                      "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      !params.categoryId
                        ? "bg-muted font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    Toutes les catégories
                  </Link>
                </li>

                {categories.map((category) => {
                  const isCategoryActive = params.categoryId === category.id;
                  const hasActiveSubcategory = category.subcategories.some(
                    (s) => s.id === params.subcategoryId,
                  );
                  const isOpen = isCategoryActive || hasActiveSubcategory;

                  return (
                    <li key={category.id}>
                      <details open={isOpen} className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors marker:content-none hover:bg-muted">
                          <Link
                            href={filterHref({
                              categoryId: category.id,
                              subcategoryId: undefined,
                            })}
                            className={cn(
                              "flex-1 truncate",
                              isCategoryActive
                                ? "font-medium text-primary"
                                : "text-foreground",
                            )}
                          >
                            {category.name}
                          </Link>
                          {category.subcategories.length > 0 && (
                            <span className="ml-2 shrink-0 text-muted-foreground transition-transform group-open:rotate-90">
                              ›
                            </span>
                          )}
                        </summary>

                        {category.subcategories.length > 0 && (
                          <ul className="ml-2.5 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2.5">
                            {category.subcategories.map((sub) => {
                              const isSubActive =
                                params.subcategoryId === sub.id;
                              return (
                                <li key={sub.id}>
                                  <Link
                                    href={filterHref({
                                      categoryId: category.id,
                                      subcategoryId: sub.id,
                                    })}
                                    className={cn(
                                      "block rounded-md px-2.5 py-1 text-sm transition-colors",
                                      isSubActive
                                        ? "font-medium text-primary"
                                        : "text-muted-foreground hover:text-foreground",
                                    )}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </details>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Products */}
          <div className="min-w-0 flex-1">
            <div className="mb-8 flex flex-col gap-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {searchScopeLabel ?? "Produits"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {pagination
                  ? `${pagination.total} produit${pagination.total > 1 ? "s" : ""} disponible${pagination.total > 1 ? "s" : ""}`
                  : "Chargement..."}
              </p>
            </div>

            <ProductGridStatus>
              {status === "offline" || status === "rate-limited" ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-20 text-center">
                  <p className="text-sm font-medium text-foreground">
                    {status === "rate-limited"
                      ? "Trop de requêtes"
                      : "Impossible de charger les produits"}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {status === "rate-limited"
                      ? "Veuillez patienter quelques instants avant de réessayer."
                      : "Le serveur est actuellement inaccessible. Réessayez dans quelques instants."}
                  </p>
                </div>
              ) : products.length === 0 ? (
                <ProductsEmptyState
                  hasActiveFilters={hasActiveFilters}
                  searchTerm={params.search}
                  suggestions={["Riz", "T-shirt", "Smartphone"]}
                />
              ) : (
                <InfiniteProductGrid
                  key={JSON.stringify(listParams)}
                  initialProducts={products}
                  initialPage={pagination!.page}
                  initialTotalPages={pagination!.totalPages}
                  filters={listParams}
                />
              )}
            </ProductGridStatus>
          </div>
        </div>
      </div>
    </SearchTransitionProvider>
  );
}
