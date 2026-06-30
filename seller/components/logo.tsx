import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  textClassName?: string;
  dotClassName?: string;
}

export function Logo({ className, textClassName, dotClassName }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-extrabold tracking-tight",
        className,
      )}
    >
      <span className={cn("text-foreground", textClassName)}>SwiftGoma</span>
      <span className={cn("text-primary", dotClassName)}>.</span>
    </span>
  );
}
