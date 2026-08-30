import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import axios from "axios";
import {
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Store,
  Truck,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductPagination } from "@/components/products/product-pagination";
import { RatingStars } from "@/components/products/product-reviews";
import { getPublicShopBySlug } from "@/lib/api/routes/shops";
import {
  getPublicProducts,
  type PublicProduct,
  type ProductListPagination,
} from "@/lib/api/routes/products";
import { formatMoney } from "@/lib/products";
import { PRODUCTS_PAGE_SIZE } from "@/lib/constants/products";
import { getServerLocale } from "@/lib/language";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STRINGS = {
  en: {
    home: "Home",
    shops: "Shops",
    products: "products",
    delivery: "Delivery",
    reviewsCount: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    noReviews: "No reviews yet",
    productsHeading: "Products",
    resultsOne: "product",
    resultsMany: "products",
    emptyTitle: "No products yet",
    emptyDescription:
      "This shop hasn't listed any products yet — check back soon.",
  },
  fr: {
    home: "Accueil",
    shops: "Boutiques",
    products: "produits",
    delivery: "Livraison",
    reviewsCount: (n: number) => (n === 1 ? "1 avis" : `${n} avis`),
    noReviews: "Aucun avis pour le moment",
    productsHeading: "Produits",
    resultsOne: "produit",
    resultsMany: "produits",
    emptyTitle: "Aucun produit pour le moment",
    emptyDescription:
      "Cette boutique n'a pas encore ajouté de produits — revenez bientôt.",
  },
} as const;

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function parsePage(value: string): number {
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

async function loadShop(slug: string) {
  try {
    return await getPublicShopBySlug(slug);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      notFound();
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const shop = await getPublicShopBySlug(slug);
    return {
      title: `${shop.name} | Swiftgoma`,
      description: shop.description.slice(0, 160),
    };
  } catch {
    return { title: "Shop | Swiftgoma" };
  }
}

export default async function ShopDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const locale = await getServerLocale();
  const t = STRINGS[locale];

  const shop = await loadShop(slug);
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
      shopId: shop.id,
      page,
      limit: PRODUCTS_PAGE_SIZE,
    });
    products = result.products;
    pagination = result.pagination;
  } catch {
    // leave products empty — the shop header still renders fine on its own
  }

  return (
    <main>
      <div className="relative aspect-21/6 w-full overflow-hidden bg-muted sm:aspect-21/5">
        {shop.bannerUrl ? (
          <Image
            src={shop.bannerUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Store
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 -mt-12 size-24 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-md sm:size-28">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={112}
              height={112}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  {t.home}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/shops" />}>
                  {t.shops}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{shop.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mt-3 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {shop.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {shop.rating.count > 0 ? (
                <span className="flex items-center gap-1.5">
                  <RatingStars value={shop.rating.average} />
                  {shop.rating.average.toFixed(1)} ·{" "}
                  {t.reviewsCount(shop.rating.count)}
                </span>
              ) : (
                <span>{t.noReviews}</span>
              )}
              {shop.sellerProfile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {shop.sellerProfile.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="size-3.5" aria-hidden="true" />
                {pagination.total} {t.products}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              {shop.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <span className="inline-flex items-center gap-2 font-medium text-foreground">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              {t.delivery}{" "}
              {formatMoney(Number(shop.deliveryFee), shop.deliveryFeeCurrency)}
            </span>
            {shop.sellerProfile.contactPhone && (
              <a
                href={`tel:${shop.sellerProfile.contactPhone}`}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="size-4" aria-hidden="true" />
                {shop.sellerProfile.contactPhone}
              </a>
            )}
            {shop.sellerProfile.whatsappNumber && (
              <a
                href={`https://wa.me/${shop.sellerProfile.whatsappNumber.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                WhatsApp
              </a>
            )}
            {shop.sellerProfile.contactEmail && (
              <a
                href={`mailto:${shop.sellerProfile.contactEmail}`}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4" aria-hidden="true" />
                {shop.sellerProfile.contactEmail}
              </a>
            )}
          </div>
        </div>

        <div className="py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t.productsHeading}
            </h2>
            {pagination.total > 0 && (
              <p className="text-sm text-muted-foreground">
                {pagination.total}{" "}
                {pagination.total === 1 ? t.resultsOne : t.resultsMany}
              </p>
            )}
          </div>

          {products.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
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
                  basePath={`/shops/${slug}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
