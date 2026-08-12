import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { publicApi } from "@/lib/api/routes/public";
import { ApiException } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { InfiniteProductGrid } from "@/components/products/infinite-product-grid";
import { CategoryProductFilters } from "@/components/products/category-product-filters";
import { ProductsEmptyState } from "@/components/products/empty-state";
import { ServerErrorBanner } from "@/components/global/server-error-banner";
import { CATEGORIES } from "@/lib/mock-categories";
import { cn } from "@/lib/utils";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    subcategoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    currency?: string;
    city?: string;
    inStockOnly?: string;
    sortBy?: string;
  }>;
};

async function resolveCategory(slug: string) {
  let categories: Awaited<ReturnType<typeof publicApi.listCategories>> =
    CATEGORIES;
  try {
    categories = await publicApi.listCategories();
  } catch {
    // fall back to mock categories
  }
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await resolveCategory(slug);
  if (!category) return { title: "Catégorie" };

  return buildPageMetadata({
    title: category.name,
    description: `Découvrez tous les produits de la catégorie ${category.name} sur SwiftGoma.`,
    path: `/categories/${slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await resolveCategory(slug);
  if (!category) notFound();

  const selectedSubcategory = category.subcategories.find(
    (s) => s.id === sp.subcategoryId,
  );

  const listParams = {
    categoryId: category.id,
    subcategoryId: sp.subcategoryId,
    search: sp.search,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    currency: sp.currency as "USD" | "CDF" | undefined,
    city: sp.city,
    inStockOnly: sp.inStockOnly === "true",
    sortBy: sp.sortBy as "recent" | "priceAsc" | "priceDesc" | undefined,
  };

  const hasActiveFilters = Boolean(
    sp.search ||
    sp.subcategoryId ||
    sp.minPrice ||
    sp.maxPrice ||
    sp.currency ||
    sp.city ||
    sp.inStockOnly === "true" ||
    sp.sortBy,
  );

  let products: Awaited<ReturnType<typeof publicApi.listProducts>>["products"] =
    [];
  let pagination:
    | Awaited<ReturnType<typeof publicApi.listProducts>>["pagination"]
    | null = null;
  let isServerDown = false;

  try {
    const result = await publicApi.listProducts(listParams);
    products = result.products;
    pagination = result.pagination;
  } catch (err) {
    if (err instanceof ApiException && err.isNetworkError) {
      isServerDown = true;
    } else {
      console.error("[CategoryPage] Failed to load products:", err);
    }
  }

  function subcategoryHref(subcategoryId: string | null) {
    const params = new URLSearchParams();
    if (subcategoryId) params.set("subcategoryId", subcategoryId);
    if (sp.sortBy) params.set("sortBy", sp.sortBy);
    return `/categories/${slug}${params.toString() ? `?${params}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {category.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {pagination
              ? `${pagination.total} produit${pagination.total > 1 ? "s" : ""} disponible${pagination.total > 1 ? "s" : ""}`
              : "Chargement..."}
          </p>
        </div>

        {/* Subcategory pills */}
        {category.subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={subcategoryHref(null)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                !sp.subcategoryId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary",
              )}
            >
              Tout
            </Link>
            {category.subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={subcategoryHref(sub.id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  sp.subcategoryId === sub.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:border-primary",
                )}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="shrink-0 lg:sticky lg:top-24 lg:w-80">
          <CategoryProductFilters categorySlug={slug} />
        </aside>

        <div className="min-w-0 flex-1">
          {isServerDown ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-20 text-center">
              <p className="text-sm font-medium text-foreground">
                Impossible de charger les produits
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Le serveur est actuellement inaccessible. Réessayez dans
                quelques instants.
              </p>
            </div>
          ) : products.length === 0 ? (
            <ProductsEmptyState
              hasActiveFilters={hasActiveFilters}
              searchTerm={sp.search}
              suggestions={[]}
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
        </div>
      </div>
    </div>
  );
}
