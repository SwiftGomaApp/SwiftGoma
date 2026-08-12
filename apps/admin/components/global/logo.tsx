import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  variant?: "full" | "icon";
  size?: number;
  className?: string;
};

export function Logo({
  href = "/",
  variant = "full",
  size = 18,
  className,
}: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-1.5", className)}
    >
      <Image
        src="/icon.png"
        alt=""
        width={size}
        height={size}
        priority
        style={{ width: size, height: size }}
        className="shrink-0"
      />

      {variant === "full" && (
        <span className="flex items-baseline text-base font-extrabold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
          SwiftGoma
          <span className="text-primary">.</span>
        </span>
      )}

      <span className="sr-only">SwiftGoma</span>
    </Link>
  );
}
