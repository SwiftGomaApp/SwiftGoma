import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ProductFilters,
  type ProductFilterValues,
} from "@/components/products/product-filters";
import { ProductHeroSearch } from "@/components/products/product-hero-search";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductPagination } from "@/components/products/product-pagination";
import {
  getPublicCategories,
  getPublicProducts,
  type ProductListPagination,
  type PublicCategory,
  type PublicProduct,
} from "@/lib/api/routes/products";
import {
  PRODUCTS_PAGE_SIZE,
  PRODUCT_SORT_OPTIONS,
  type ProductSortValue,
} from "@/lib/constants/products";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Products | Swiftgoma",
  description:
    "Browse and filter products from sellers across Goma on Swiftgoma.",
};

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams>;
};

const STRINGS = {
  en: {
    eyebrow: "Swiftgoma Marketplace",
    title: "Everything Goma has to offer, in one place.",
    description:
      "Discover products from local sellers across Goma, browse categories, compare shops, and get it delivered.",
    searchPlaceholder: "Search for products…",
    searchButton: "Search",
    resultsOne: "product found",
    resultsMany: "products found",
    emptyTitle: "No products match your filters",
    emptyDescription:
      "Try adjusting or clearing your filters to see more results.",
    clear: "Clear filters",
    loadErrorTitle: "Products are temporarily unavailable",
    loadErrorDescription:
      "We couldn't load products right now. Please try again shortly.",
  },
  fr: {
    eyebrow: "Marché Swiftgoma",
    title: "Tout ce que Goma a à offrir, au même endroit.",
    description:
      "Découvrez des produits de vendeurs locaux à Goma, parcourez les catégories, comparez les boutiques et faites-vous livrer.",
    searchPlaceholder: "Rechercher des produits…",
    searchButton: "Rechercher",
    resultsOne: "produit trouvé",
    resultsMany: "produits trouvés",
    emptyTitle: "Aucun produit ne correspond à vos filtres",
    emptyDescription:
      "Essayez d'ajuster ou d'effacer vos filtres pour voir plus de résultats.",
    clear: "Effacer les filtres",
    loadErrorTitle: "Produits temporairement indisponibles",
    loadErrorDescription:
      "Impossible de charger les produits pour le moment. Réessayez bientôt.",
  },
} as const;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parseSortBy(value: string): ProductSortValue {
  const match = PRODUCT_SORT_OPTIONS.find((option) => option.value === value);
  return match?.value ?? "recent";
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parsePriceInput(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default async function ProductsPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  const sp = await searchParams;

  const rawCategoryId = firstValue(sp.categoryId);
  const rawSubcategoryId = firstValue(sp.subcategoryId);

  const filterValues: ProductFilterValues = {
    search: firstValue(sp.search),
    categoryId: rawCategoryId || "all",
    subcategoryId: rawSubcategoryId || "all",
    currency: firstValue(sp.currency),
    minPrice: firstValue(sp.minPrice),
    maxPrice: firstValue(sp.maxPrice),
    inStockOnly: sp.inStockOnly !== undefined,
    sortBy: parseSortBy(firstValue(sp.sortBy)),
  };

  const page = parsePage(firstValue(sp.page));

  let products: PublicProduct[] = [];
  let pagination: ProductListPagination = {
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };
  let categories: PublicCategory[] = [];
  let loadError = false;

  try {
    const [productResult, categoryResult] = await Promise.all([
      getPublicProducts({
        page,
        limit: PRODUCTS_PAGE_SIZE,
        categoryId:
          filterValues.categoryId !== "all"
            ? filterValues.categoryId
            : undefined,
        subcategoryId:
          filterValues.subcategoryId !== "all"
            ? filterValues.subcategoryId
            : undefined,
        currency: filterValues.currency || undefined,
        minPrice: parsePriceInput(filterValues.minPrice),
        maxPrice: parsePriceInput(filterValues.maxPrice),
        search: filterValues.search || undefined,
        inStockOnly: filterValues.inStockOnly || undefined,
        sortBy: filterValues.sortBy,
      }),
      getPublicCategories(),
    ]);
    products = productResult.products;
    pagination = productResult.pagination;
    categories = categoryResult;
  } catch {
    loadError = true;
  }

  return (
    <main>
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.description}
          </p>
          <ProductHeroSearch
            initialSearch={filterValues.search}
            placeholder={t.searchPlaceholder}
            buttonLabel={t.searchButton}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {!loadError && (
            <p className="text-sm text-muted-foreground">
              {pagination.total}{" "}
              {pagination.total === 1 ? t.resultsOne : t.resultsMany}
            </p>
          )}
          <ProductFilters
            categories={categories}
            values={filterValues}
            resultsCount={pagination.total}
            locale={locale}
          />
        </div>

        {loadError ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch />
              </EmptyMedia>
              <EmptyTitle>{t.loadErrorTitle}</EmptyTitle>
              <EmptyDescription>{t.loadErrorDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : products.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                {t.clear}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <ProductGrid products={products} />
            <div className="mt-10">
              <ProductPagination pagination={pagination} searchParams={sp} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
