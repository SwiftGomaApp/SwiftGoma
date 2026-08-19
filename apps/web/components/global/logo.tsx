import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  variant?: "full" | "icon";
  size?: number;
  className?: string;
};

const Logo = ({
  href = "/",
  variant = "full",
  size = 24,
  className,
}: LogoProps) => {
  return (
    <Link href={href} className={`flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/icon.png"
        alt={variant === "icon" ? "SwiftGoma" : ""}
        width={size}
        height={size}
        priority
        style={{ width: size, height: size }}
      />

      {variant === "full" && (
        <span
          className="flex items-baseline font-extrabold tracking-tight text-foreground"
          style={{ fontSize: size * 1.25 }}
        >
          SwiftGoma
          <span className="text-primary">.</span>
        </span>
      )}

      <span className="sr-only">SwiftGoma</span>
    </Link>
  );
};

export default Logo;
