"use client";

import { Check } from "lucide-react";
import type { OrderFulfillmentMethod, OrderStatus } from "@/lib/api/routes/orders";
import { getOrderTimeline } from "@/lib/orders";
import { cn } from "@/lib/utils";

type OrderStatusTimelineProps = {
  status: OrderStatus;
  fulfillmentMethod: OrderFulfillmentMethod;
  className?: string;
};

export function OrderStatusTimeline({
  status,
  fulfillmentMethod,
  className,
}: OrderStatusTimelineProps) {
  const { steps, currentIndex, isFailed } = getOrderTimeline(
    status,
    fulfillmentMethod,
  );

  if (isFailed || currentIndex < 0) {
    return null;
  }

  return (
    <ol className={cn("flex flex-col gap-0", className)}>
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                  !isComplete &&
                    !isCurrent &&
                    "border-border bg-muted text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "my-1 w-0.5 flex-1 min-h-6 rounded-full",
                    isComplete ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-medium leading-7",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                  isComplete && "text-foreground",
                )}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-primary">Étape en cours</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
