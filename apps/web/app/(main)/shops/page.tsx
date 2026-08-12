import Link from "next/link";
import Image from "next/image";
import { Store } from "lucide-react";
import type { Metadata } from "next";
import { publicApi } from "@/lib/api/routes/public";
import { ApiException } from "@/lib/api";
import { ServerErrorBanner } from "@/components/global/server-error-banner";
import { ImageWithFallback } from "@/components/global/image-with-fallback";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Boutiques",
  description:
    "Découvrez les boutiques vendeuses sur SwiftGoma et achetez auprès de commerçants locaux en RDC et au Rwanda.",
  path: "/shops",
});

export default async function ShopsPage() {
  let shops: Awaited<ReturnType<typeof publicApi.listShops>>["shops"] = [];
  let isServerDown = false;

  try {
    const result = await publicApi.listShops({ limit: 24 });
    shops = result.shops;
  } catch (err) {
    if (err instanceof ApiException && err.isNetworkError) {
      isServerDown = true;
    } else {
      console.error("[ShopsPage] Failed to load shops:", err);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Boutiques
        </h1>
        <p className="text-sm text-muted-foreground">
          Découvrez les vendeurs de Swiftgoma
        </p>
      </div>

      {isServerDown && <ServerErrorBanner />}

      {!isServerDown && shops.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Aucune boutique disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shops/${shop.slug}`}
              className="flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
                {shop.logoUrl ? (
                  <ImageWithFallback
                    src={shop.logoUrl}
                    alt={shop.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Store className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {shop.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {shop._count.products} produit
                  {shop._count.products > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
