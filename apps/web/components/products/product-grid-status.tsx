"use client";

import { useSearchTransition } from "./search-transition-context";
import { ProductCardSkeleton } from "./product-card-skeleton";

export function ProductGridStatus({ children }: { children: React.ReactNode }) {
  const { isPending } = useSearchTransition();

  return (
    <div className="relative">
      <div
        className={
          isPending
            ? "pointer-events-none opacity-40 transition-opacity"
            : "transition-opacity"
        }
      >
        {children}
      </div>

      {isPending && (
        <div className="absolute inset-0 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
