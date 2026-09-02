import { Skeleton } from "@/components/ui/skeleton";

function ProductCardSkeleton() {
  return (
    <div className="w-full max-w-70 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12 shrink-0" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="size-11 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <main>
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-10 w-full max-w-2xl sm:h-11" />
          <Skeleton className="mt-3 h-10 w-full max-w-xl sm:h-6" />
          <div className="mt-8 flex w-full max-w-xl gap-2">
            <Skeleton className="h-12 flex-1 rounded-md" />
            <Skeleton className="h-12 w-28 rounded-md" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </section>
    </main>
  );
}
