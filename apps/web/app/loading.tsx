import { Skeleton } from "@/components/ui/skeleton";

function StepCardSkeleton() {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-5">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="mt-4 size-5 rounded-sm" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-1.5 h-3.5 w-full" />
      <Skeleton className="mt-1 h-3.5 w-5/6" />
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4">
      <Skeleton className="size-11 rounded-full" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="w-full max-w-55 shrink-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10 shrink-0" />
          </div>
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  );
}

function ShopCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 shadow-xs">
      <Skeleton className="aspect-16/7 w-full rounded-none" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <Skeleton className="-mt-6 size-14 shrink-0 rounded-xl border-2 border-card" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <div className="mt-2 flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function TeaserSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Skeleton className="mx-auto h-3.5 w-28" />
        <Skeleton className="mx-auto mt-3 h-7 w-3/4" />
        <Skeleton className="mx-auto mt-3 h-4 w-5/6" />
      </div>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </section>
  );
}

export default function HomeLoading() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-muted/40">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-10 w-full max-w-2xl sm:h-12" />
          <Skeleton className="mt-3 h-6 w-full max-w-xl" />
          <Skeleton className="mt-2 h-6 w-3/4 max-w-md" />

          <div className="mt-6 w-full max-w-xl">
            <Skeleton className="h-12 w-full rounded-full" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <Skeleton className="mx-auto h-6 w-44" />
          <Skeleton className="mx-auto mt-2 h-3.5 w-64" />
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StepCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-3.5 w-56" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Trending products */}
      <section className="border-t bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-sm" />
            <Skeleton className="h-6 w-44" />
          </div>
          <Skeleton className="mt-2 h-3.5 w-64" />
          <div className="mt-8 flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured shops */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-sm" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="mt-2 h-3.5 w-56" />
          </div>
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShopCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* About / testimonials / FAQ teasers */}
      <TeaserSkeleton />
      <TeaserSkeleton />
    </main>
  );
}
