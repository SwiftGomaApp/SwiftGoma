import { Skeleton } from "@/components/ui/skeleton";

function NavCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
    </div>
  );
}

function SettingRowSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Skeleton className="h-4.5 w-28" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-20 rounded-md" />
      </div>
    </div>
  );
}

export default function AccountOverviewLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <NavCardSkeleton key={i} />
        ))}
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-3.5 w-56" />
        </div>
        <SettingRowSkeleton />
        <div className="border-t border-border" />
        <SettingRowSkeleton />
        <div className="border-t border-border" />
        <SettingRowSkeleton />
      </div>
    </div>
  );
}
