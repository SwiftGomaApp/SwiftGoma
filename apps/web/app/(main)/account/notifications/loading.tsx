import { Skeleton } from "@/components/ui/skeleton";

function NotificationRowSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-4">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3.5 w-full" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>
    </div>
  );
}

export default function AccountNotificationsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-9 w-16 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <NotificationRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
