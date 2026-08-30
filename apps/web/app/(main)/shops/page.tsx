import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ProductHeroSearch } from "@/components/products/product-hero-search";
import { ProductPagination } from "@/components/products/product-pagination";
import { ShopGrid } from "@/components/shops/shop-grid";
import {
  getPublicShops,
  type PublicShop,
  type ShopListPagination,
} from "@/lib/api/routes/shops";
import { SHOPS_PAGE_SIZE } from "@/lib/constants/shops";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Shops | Swiftgoma",
  description: "Browse local shops and sellers across Goma on Swiftgoma.",
};

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams>;
};

const STRINGS = {
  en: {
    eyebrow: "Swiftgoma Marketplace",
    title: "Every shop in Goma, in one place.",
    description:
      "Browse local sellers across Goma — from neighborhood stores to independent shops, all in one marketplace.",
    searchPlaceholder: "Search for shops…",
    searchButton: "Search",
    resultsOne: "shop found",
    resultsMany: "shops found",
    products: "products",
    deliveryFrom: "Delivery",
    emptyTitle: "No shops match your search",
    emptyDescription: "Try a different search to see more results.",
    clear: "Clear search",
    loadErrorTitle: "Shops are temporarily unavailable",
    loadErrorDescription:
      "We couldn't load shops right now. Please try again shortly.",
  },
  fr: {
    eyebrow: "Marché Swiftgoma",
    title: "Toutes les boutiques de Goma, au même endroit.",
    description:
      "Parcourez les vendeurs locaux de Goma — des boutiques de quartier aux commerçants indépendants, réunis sur un seul marché.",
    searchPlaceholder: "Rechercher des boutiques…",
    searchButton: "Rechercher",
    resultsOne: "boutique trouvée",
    resultsMany: "boutiques trouvées",
    products: "produits",
    deliveryFrom: "Livraison",
    emptyTitle: "Aucune boutique ne correspond à votre recherche",
    emptyDescription:
      "Essayez une autre recherche pour voir plus de résultats.",
    clear: "Effacer la recherche",
    loadErrorTitle: "Boutiques temporairement indisponibles",
    loadErrorDescription:
      "Impossible de charger les boutiques pour le moment. Réessayez bientôt.",
  },
} as const;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function ShopsPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  const sp = await searchParams;

  const search = firstValue(sp.search);
  const page = parsePage(firstValue(sp.page));

  let shops: PublicShop[] = [];
  let pagination: ShopListPagination = {
    page: 1,
    limit: SHOPS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };
  let loadError = false;

  try {
    const result = await getPublicShops({
      page,
      limit: SHOPS_PAGE_SIZE,
      search: search || undefined,
    });
    shops = result.shops;
    pagination = result.pagination;
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
            initialSearch={search}
            placeholder={t.searchPlaceholder}
            buttonLabel={t.searchButton}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {!loadError && (
          <p className="mb-6 text-sm text-muted-foreground">
            {pagination.total}{" "}
            {pagination.total === 1 ? t.resultsOne : t.resultsMany}
          </p>
        )}

        {loadError ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Store />
              </EmptyMedia>
              <EmptyTitle>{t.loadErrorTitle}</EmptyTitle>
              <EmptyDescription>{t.loadErrorDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : shops.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Store />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/shops" />}
              >
                {t.clear}
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <ShopGrid
              shops={shops}
              productsLabel={t.products}
              deliveryLabel={t.deliveryFrom}
            />
            <div className="mt-10">
              <ProductPagination
                pagination={pagination}
                searchParams={sp}
                basePath="/shops"
              />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
