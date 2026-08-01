import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  variant?: "full" | "icon";
  className?: string;
};

const Logo = ({ href = "/", variant = "full", className }: LogoProps) => {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/icon.png"
        alt={variant === "icon" ? "SwiftGoma" : ""}
        width={40}
        height={40}
        priority
        className="h-6 w-6"
      />

      {variant === "full" && (
        <span className="flex items-baseline text-3xl font-extrabold tracking-tight text-foreground">
          SwiftGoma
          <span className="text-primary">.</span>
        </span>
      )}

      <span className="sr-only">SwiftGoma</span>
    </Link>
  );
};

export default Logo;
