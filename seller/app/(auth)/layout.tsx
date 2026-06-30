import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s · SwiftGoma Vendeur",
    default: "Authentification · SwiftGoma Vendeur",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="min-h-screen">{children}</div>;
}
