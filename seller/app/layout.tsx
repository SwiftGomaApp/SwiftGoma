import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { QueryProvider } from "@/src/providers/query-provider";
import { AuthProvider } from "@/src/providers/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SwiftGoma — Espace Vendeur",
    template: "%s · SwiftGoma Vendeur",
  },
  description:
    "Gérez votre boutique, vos produits, vos commandes et vos livreurs sur SwiftGoma — la marketplace locale de Goma, RDC.",
  keywords: [
    "SwiftGoma",
    "vendeur",
    "boutique en ligne",
    "Goma",
    "RDC",
    "marketplace",
    "mobile money",
  ],
  authors: [{ name: "SwiftGoma" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://seller.swiftgoma.com",
  ),
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SwiftGoma — Espace Vendeur",
    description:
      "Gérez votre boutique, vos produits, vos commandes et vos livreurs sur SwiftGoma.",
    siteName: "SwiftGoma",
    locale: "fr_CD",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
