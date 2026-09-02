"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AppleIcon } from "@/components/global/icons";
import { cn } from "@/lib/utils";

export function AppleAuthButton({
  label = "Apple",
  disabled,
  className,
}: {
  label?: ReactNode;
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
