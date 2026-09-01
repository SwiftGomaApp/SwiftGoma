import Link from "next/link";
import { ShopCard } from "@/components/shops/shop-card";
import type { PublicShop } from "@/lib/api/routes/shops";

export function ShopGrid({
  shops,
  productsLabel,
  deliveryLabel,
}: {
  shops: PublicShop[];
  productsLabel: string;
  deliveryLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <Link key={shop.id} href={`/shops/${shop.slug}`} className="block">
          <ShopCard
            shop={shop}
            productsLabel={productsLabel}
            deliveryLabel={deliveryLabel}
          />
        </Link>
      ))}
    </div>
  );
}

export default ShopGrid;
