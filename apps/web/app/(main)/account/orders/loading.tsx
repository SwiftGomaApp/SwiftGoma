import { Skeleton } from "@/components/ui/skeleton";

function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-12" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3.5 w-12" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function AccountOrdersLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Skeleton className="mt-6 h-3.5 w-20" />

      <div className="mt-4 flex flex-col gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
