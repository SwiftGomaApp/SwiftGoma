import Image from "next/image";
import { Store, Package } from "lucide-react";
import type { PublicShop } from "@/lib/api/routes/shops";
import { formatMoney } from "@/lib/products";

export function ShopCard({
  shop,
  productsLabel,
  deliveryLabel,
}: {
  shop: PublicShop;
  productsLabel: string;
  deliveryLabel: string;
}) {
  return (
    <div
      data-slot="shop-card"
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-16/7 w-full overflow-hidden bg-muted">
        {shop.bannerUrl ? (
          <Image
            src={shop.bannerUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Store
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <div className="relative z-10 -mt-6 size-14 shrink-0 overflow-hidden rounded-xl border-2 border-card bg-background shadow-sm">
          {shop.logoUrl ? (
            <Image
              src={shop.logoUrl}
              alt={shop.name}
              width={56}
              height={56}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-semibold text-muted-foreground">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h3 className="truncate text-base font-semibold text-card-foreground">
          {shop.name}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {shop.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Package className="size-3.5" aria-hidden="true" />
            {shop._count.products} {productsLabel}
          </span>
          <span className="font-medium text-foreground">
            {deliveryLabel}{" "}
            {formatMoney(Number(shop.deliveryFee), shop.deliveryFeeCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ShopCard;
