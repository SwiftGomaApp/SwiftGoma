import Link from "next/link";
import { PackageSearch, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

type ShopEmptyStateProps = {
  hasActiveFilters: boolean;
  shopSlug: string;
  shopName: string;
};

export function ShopEmptyState({
  hasActiveFilters,
  shopSlug,
  shopName,
}: ShopEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        {hasActiveFilters ? (
          <PackageSearch className="h-6 w-6 text-muted-foreground" />
        ) : (
          <Store className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">
          {hasActiveFilters
            ? "Aucun produit ne correspond à vos filtres"
            : "Aucun produit pour le moment"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasActiveFilters
            ? `Essayez d'élargir votre recherche : changez de catégorie, ajustez le prix, ou retirez un filtre.`
            : `${shopName} n'a pas encore publié de produits. Revenez bientôt.`}
        </p>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/shops/${shopSlug}`} />}
        >
          Réinitialiser les filtres
        </Button>
      )}
    </div>
  );
}
