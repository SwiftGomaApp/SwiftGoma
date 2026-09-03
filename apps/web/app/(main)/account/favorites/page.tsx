import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import axios from "axios";
import { Heart } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { ProductPagination } from "@/components/products/product-pagination";
import {
  getMyFavorites,
  type FavoritesListPagination,
} from "@/lib/api/routes/favorites.server";
import type { PublicProduct } from "@/lib/api/routes/products";
import { getServerLocale } from "@/lib/language";
import { FavoritesGrid } from "@/components/account/favorites-grid";
import { getRequestPathname } from "@/lib/auth/request-pathname.server";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";

export const metadata: Metadata = {
  title: "Favorites | Swiftgoma",
};

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> };

const STRINGS = {
  en: {
    title: "Favorites",
    description: "Products you've saved, all in one place.",
    resultsOne: "product",
    resultsMany: "products",
    emptyTitle: "No favorites yet",
    emptyDescription: "Tap the heart on any product to save it here.",
    browseProducts: "Browse products",
  },
  fr: {
    title: "Favoris",
    description: "Les produits que vous avez enregistrés, au même endroit.",
    resultsOne: "produit",
    resultsMany: "produits",
    emptyTitle: "Aucun favori pour le moment",
    emptyDescription:
      "Appuyez sur le cœur d'un produit pour l'enregistrer ici.",
    browseProducts: "Parcourir les produits",
  },
} as const;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AccountFavoritesPage({ searchParams }: Props) {
  const locale = await getServerLocale();
  const t = STRINGS[locale];
  const sp = await searchParams;
  const page = parsePage(firstValue(sp.page));

  let products: PublicProduct[] = [];
  let pagination: FavoritesListPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  try {
    const result = await getMyFavorites({ page, limit: 20 });
    products = result.products;
    pagination = result.pagination;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      redirect(buildSignInHref(await getRequestPathname()));
    }
    throw err;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>

      {pagination.total > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {pagination.total}{" "}
          {pagination.total === 1 ? t.resultsOne : t.resultsMany}
        </p>
      )}

      {products.length === 0 ? (
        <div className="mt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Heart />
              </EmptyMedia>
              <EmptyTitle>{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button nativeButton={false} render={<Link href="/products" />}>
                {t.browseProducts}
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <FavoritesGrid products={products} />
          </div>
          <div className="mt-8">
            <ProductPagination
              pagination={pagination}
              searchParams={sp}
              basePath="/account/favorites"
            />
          </div>
        </>
      )}
    </div>
  );
}
