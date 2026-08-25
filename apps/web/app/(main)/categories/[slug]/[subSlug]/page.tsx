import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageSearch, SlidersHorizontal } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductPagination } from "@/components/products/product-pagination";
import {
  getPublicCategories,
  getPublicProducts,
  type ProductListPagination,
  type PublicProduct,
} from "@/lib/api/routes/products";
import {
  PRODUCTS_PAGE_SIZE,
  PRODUCT_SORT_OPTIONS,
  type ProductSortValue,
} from "@/lib/constants/products";
import { getServerLocale } from "@/lib/language";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ slug: string; subSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STRINGS = {
  en: {
    home: "Home",
    categories: "Categories",
    resultsOne: "product found",
    resultsMany: "products found",
    refine: "Refine search",
    emptyTitle: "No products in this subcategory yet",
    emptyDescription: "Check back soon, or browse other categories.",
  },
  fr: {
    home: "Accueil",
    categories: "Catégories",
    resultsOne: "produit trouvé",
    resultsMany: "produits trouvés",
    refine: "Affiner la recherche",
    emptyTitle: "Aucun produit dans cette sous-catégorie pour le moment",
    emptyDescription: "Revenez bientôt ou explorez d'autres catégories.",
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

async function loadCategoryAndSubcategory(slug: string, subSlug: string) {
  const categories = await getPublicCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  const subcategory = category.subcategories.find((s) => s.slug === subSlug);
  if (!subcategory) return null;
  return { category, subcategory };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, subSlug } = await params;
  const match = await loadCategoryAndSubcategory(slug, subSlug).catch(
    () => null,
  );
  if (!match) return { title: "Subcategory | Swiftgoma" };
  return {
    title: `${match.subcategory.name} | ${match.category.name} | Swiftgoma`,
    description: `Browse ${match.subcategory.name} products on Swiftgoma.`,
  };
}

export default async function SubcategoryPage({
  params,
  searchParams,
}: Props) {
  const { slug, subSlug } = await params;
  const sp = await searchParams;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const match = await loadCategoryAndSubcategory(slug, subSlug);
  if (!match) notFound();
  const { category, subcategory } = match;

  const sortBy = parseSortBy(firstValue(sp.sortBy));
  const page = parsePage(firstValue(sp.page));

  let products: PublicProduct[] = [];
  let pagination: ProductListPagination = {
    page: 1,
    limit: PRODUCTS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  try {
    const result = await getPublicProducts({
      subcategoryId: subcategory.id,
      page,
      limit: PRODUCTS_PAGE_SIZE,
      sortBy,
    });
    products = result.products;
    pagination = result.pagination;
  } catch {
    products = [];
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              {t.home}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/categories" />}>
              {t.categories}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/categories/${category.slug}`} />}
            >
              {category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subcategory.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {subcategory.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pagination.total}{" "}
            {pagination.total === 1 ? t.resultsOne : t.resultsMany}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          nativeButton={false}
          render={
            <Link
              href={`/products?categoryId=${category.id}&subcategoryId=${subcategory.id}`}
            />
          }
        >
          <SlidersHorizontal className="size-4" />
          {t.refine}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRODUCT_SORT_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`?sortBy=${option.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              sortBy === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label[locale]}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ProductGrid products={products} />
            <div className="mt-10">
              <ProductPagination
                pagination={pagination}
                searchParams={sp}
                basePath={`/categories/${category.slug}/${subcategory.slug}`}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
