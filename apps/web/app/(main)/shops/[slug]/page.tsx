import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Store, Truck, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { publicApi } from "@/lib/api/routes/public";
import { ApiException } from "@/lib/api";
import { InfiniteProductGrid } from "@/components/products/infinite-product-grid";
import { ShopProductFilters } from "@/components/products/shop-product-filters";
import { ImageWithFallback } from "@/components/global/image-with-fallback";
import { ServerErrorBanner } from "@/components/global/server-error-banner";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { ShopEmptyState } from "@/components/products/shop-empty-state";
import { RatingStars } from "@/components/products/rating-stars";

type ShopPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    currency?: string;
    inStockOnly?: string;
    sortBy?: string;
  }>;
};

export async function generateMetadata({
  params,
}: ShopPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const shop = await publicApi.getShopBySlug(slug);
    return {
      title: shop.name,
      description: shop.description.slice(0, 160),
      openGraph: {
        title: shop.name,
        description: shop.description.slice(0, 160),
        images: shop.bannerUrl ? [{ url: shop.bannerUrl }] : undefined,
      },
    };
  } catch {
    return { title: "Boutique" };
  }
}

export default async function ShopPage({
  params,
  searchParams,
}: ShopPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  let shop;
  try {
    shop = await publicApi.getShopBySlug(slug);
  } catch (err) {
    if (err instanceof ApiException) {
      if (err.isNetworkError) {
        return (
          <div className="mx-auto max-w-7xl px-6 py-10">
            <ServerErrorBanner />
          </div>
        );
      }
      if (err.statusCode === 404) {
        notFound();
      }
    }
    throw err;
  }

  const listParams = {
    shopId: shop.id,
    search: sp.search,
    categoryId: sp.categoryId,
    subcategoryId: sp.subcategoryId,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    currency: sp.currency as "USD" | "CDF" | undefined,
    inStockOnly: sp.inStockOnly === "true",
    sortBy: sp.sortBy as "recent" | "priceAsc" | "priceDesc" | undefined,
  };

  const hasActiveFilters = Boolean(
    sp.search ||
    sp.categoryId ||
    sp.subcategoryId ||
    sp.minPrice ||
    sp.maxPrice ||
    sp.currency ||
    sp.inStockOnly === "true" ||
    sp.sortBy,
  );

  let products: Awaited<ReturnType<typeof publicApi.listProducts>>["products"] =
    [];
  let pagination:
    | Awaited<ReturnType<typeof publicApi.listProducts>>["pagination"]
    | null = null;

  try {
    const result = await publicApi.listProducts(listParams);
    products = result.products;
    pagination = result.pagination;
  } catch {
    // graceful — shop page still renders, just with no products shown
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-40 w-full bg-muted sm:h-56">
        {shop.bannerUrl && (
          <ImageWithFallback
            src={shop.bannerUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Sticky sidebar: info + filters, stacked together */}
          <aside className="flex shrink-0 flex-col gap-6 lg:sticky lg:top-24 lg:w-80">
            <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted">
                  {shop.logoUrl ? (
                    <ImageWithFallback
                      src={shop.logoUrl}
                      alt={shop.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <h1 className="truncate text-lg font-bold text-foreground">
                    {shop.name}
                  </h1>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {shop.sellerProfile.city}
                  </div>
                  {shop.rating && shop.rating.count > 0 && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <RatingStars rating={shop.rating.average} />
                      <span className="text-xs text-muted-foreground">
                        {shop.rating.average.toFixed(1)} ({shop.rating.count}{" "}
                        avis)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {shop.description}
              </p>

              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                Livraison : {shop.deliveryFee} {shop.deliveryFeeCurrency}
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <span className="text-xs font-medium text-muted-foreground">
                  Contact
                </span>
                <a
                  href={buildWhatsAppLink(
                    shop.sellerProfile.whatsappNumber,
                    `Bonjour, j'ai une question à propos de la boutique ${shop.name}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {shop.sellerProfile.whatsappNumber}
                </a>
                <a
                  href={`tel:${shop.sellerProfile.contactPhone}`}
                  className="flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {shop.sellerProfile.contactPhone}
                </a>
                <a
                  href={`mailto:${shop.sellerProfile.contactEmail}`}
                  className="flex items-center gap-2 truncate text-sm text-foreground transition-colors hover:text-primary"
                >
                  <span className="flex shrink-0">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <span className="truncate">
                    {shop.sellerProfile.contactEmail}
                  </span>
                </a>
              </div>
            </div>

            <ShopProductFilters shopSlug={shop.slug} />
          </aside>

          {/* Products */}
          <div className="min-w-0 flex-1">
            <h2 className="mb-6 text-lg font-semibold text-foreground">
              Produits ({pagination?.total ?? 0})
            </h2>

            {products.length === 0 ? (
              <ShopEmptyState
                hasActiveFilters={hasActiveFilters}
                shopSlug={shop.slug}
                shopName={shop.name}
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
    </div>
  );
}
