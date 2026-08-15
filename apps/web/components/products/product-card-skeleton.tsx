export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
      {/* Image */}
      <div className="relative aspect-square w-full animate-pulse bg-muted">
        <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-background/80" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-4">
        {/* Shop row */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        </div>

        {/* Price */}
        <div className="mt-1 h-4 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
