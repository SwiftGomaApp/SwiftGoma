"use client";

import { Spinner } from "@/components/ui/spinner";

export function FullPageSpinner({
  label = "Chargement…",
}: {
  label?: string;
}) {
  return (
    <div className="bg-background flex h-svh w-full flex-col items-center justify-center gap-3">
      <Spinner className="size-8" />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
