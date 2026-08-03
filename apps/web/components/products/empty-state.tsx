import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  hasActiveFilters: boolean;
  searchTerm?: string;
  suggestions?: string[];
};

export function ProductsEmptyState({
  hasActiveFilters,
  searchTerm,
  suggestions = [],
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-medium text-foreground">
          {searchTerm
            ? `Aucun résultat pour « ${searchTerm} »`
            : "Aucun produit trouvé"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasActiveFilters
            ? "Essayez d'élargir votre recherche : changez de catégorie, ajustez le prix, ou retirez un filtre."
            : "Il n'y a pas encore de produits disponibles ici. Revenez bientôt."}
        </p>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/products" />}
        >
          Réinitialiser les filtres
        </Button>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            Essayez plutôt :
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((term) => (
              <Link
                key={term}
                href={`/products?search=${encodeURIComponent(term)}`}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
