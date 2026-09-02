import { Skeleton } from "@/components/ui/skeleton";

function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3.5 w-full" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
    </div>
  );
}

export default function AllNotificationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="flex flex-col gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <NotificationRowSkeleton key={i} />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-2">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  );
}
