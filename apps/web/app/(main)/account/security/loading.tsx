import { Skeleton } from "@/components/ui/skeleton";

function SecurityRowSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="h-4.5 w-32" />
          <Skeleton className={`mt-2 h-3 ${wide ? "w-64" : "w-48"}`} />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  );
}

export default function AccountSecurityLoading() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <SecurityRowSkeleton />
      <div className="border-t border-border" />
      <SecurityRowSkeleton wide />
      <div className="border-t border-border" />
      <SecurityRowSkeleton />
      <div className="border-t border-border" />
      <SecurityRowSkeleton wide />
      <div className="border-t border-border" />
      <SecurityRowSkeleton />
    </div>
  );
}
