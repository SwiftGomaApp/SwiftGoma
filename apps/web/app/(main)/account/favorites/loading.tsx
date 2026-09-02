import { Skeleton } from "@/components/ui/skeleton";

function FavoriteCardSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
      <Skeleton className="size-24 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-14" />
        <div className="mt-auto flex items-center gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="size-9 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function AccountFavoritesLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-28" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Skeleton className="mt-6 h-3.5 w-20" />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <FavoriteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
