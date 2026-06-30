import { Logo } from "@/src/components/logo";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-5">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="text-xl" />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-5">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SwiftGoma — Goma, RDC ·{" "}
          <Link
            href="https://swiftgoma.com/legal/seller"
            className="underline underline-offset-2 hover:text-foreground"
            target="_blank"
          >
            Politique vendeur
          </Link>
        </p>
      </footer>
    </div>
  );
}
