import type { ReactNode } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  note: {
    icon: Info,
    className: "border-border bg-muted text-foreground",
    iconClassName: "text-muted-foreground",
  },
  tip: {
    icon: Lightbulb,
    className: "border-primary/25 bg-primary/5 text-foreground",
    iconClassName: "text-primary",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-delete/40 bg-delete/40 text-foreground",
    iconClassName: "text-delete-foreground",
  },
} as const;

export function Callout({
  variant = "note",
  title,
  children,
}: {
  variant?: keyof typeof VARIANTS;
  title?: string;
  children: ReactNode;
}) {
  const { icon: Icon, className, iconClassName } = VARIANTS[variant];

  return (
    <div className={cn("mb-6 flex gap-3 rounded-lg border px-4 py-3.5", className)}>
      <Icon size={16} className={cn("mt-0.5 shrink-0", iconClassName)} />
      <div className="text-sm leading-relaxed">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="text-muted-foreground [&_code]:rounded [&_code]:bg-background/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
