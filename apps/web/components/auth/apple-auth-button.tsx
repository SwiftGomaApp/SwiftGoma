"use client";

import { Button } from "@/components/ui/button";
import { AppleIcon } from "@/components/global/icons";
import { cn } from "@/lib/utils";

export function AppleAuthButton({
  label = "Apple",
  disabled,
  className,
}: {
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn("w-full gap-2", className)}
      disabled={disabled}
    >
      <AppleIcon />
      {label}
    </Button>
  );
}
