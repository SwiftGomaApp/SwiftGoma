import Link from "next/link";
import { Store, ChevronRight } from "lucide-react";

type SellerCardProps = {
  shopName: string;
  shopSlug: string;
  productCount: number;
};

export function SellerCard({
  shopName,
  shopSlug,
  productCount,
}: SellerCardProps) {
  return (
    <Link
      href={`/shops/${shopSlug}`}
      className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
        <Store className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {shopName}
        </span>
        <span className="text-xs text-muted-foreground">
          {productCount} produit{productCount > 1 ? "s" : ""} disponible
          {productCount > 1 ? "s" : ""}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
