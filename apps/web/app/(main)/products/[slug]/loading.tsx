import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-64" />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-16 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-3/4" />
          </div>

          <div className="flex flex-col gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-12 flex-1 rounded-md" />
              <Skeleton className="size-12 shrink-0 rounded-md" />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-4 border-t border-border pt-10">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </main>
  );
}
