import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  href?: string;
}

export function Logo({ className, href = "/" }: LogoProps) {
  return (
    <Link href={href} className={className}>
      <Image
        src="https://res.cloudinary.com/dx3wclabo/image/upload/v1784021180/logo_ouhcuv.png"
        alt="SwiftGoma"
        width={603}
        height={73}
        priority
        className="h-6 w-auto dark:hidden"
      />
      <Image
        src="https://res.cloudinary.com/dx3wclabo/image/upload/v1785335077/swiftgoma/seller-kyc/proof-of-address/wqqxgxriwvbtgtxobild.png"
        alt="SwiftGoma"
        width={603}
        height={73}
        priority
        className="hidden h-5 w-auto dark:block"
      />
    </Link>
  );
}
