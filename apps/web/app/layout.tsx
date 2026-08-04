import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { ConsentBanner } from "@/components/global/consent-banner";
import { AuthProvider } from "@/providers/auth-provider";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { Toaster } from "@/components/ui/toast";
import { SocketProvider } from "@/providers/socket-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://swiftgoma.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Swiftgoma — Achats en ligne et livraison rapide et fiable",
    template: "%s | Swiftgoma",
  },
  description:
    "Swiftgoma est la plateforme qui connecte acheteurs, vendeurs et livreurs pour des achats en ligne rapides et sécurisés en RDC et au Rwanda. Achetez, vendez et livrez — tout dans une seule application.",
  keywords: [
    "Swiftgoma",
    "achats en ligne RDC",
    "e-commerce Congo",
    "e-commerce Rwanda",
    "application de livraison Goma",
    "marketplace Congo",
    "acheter et vendre en ligne Congo",
    "livraison Goma",
    "boutique en ligne RDC",
  ],
  authors: [{ name: "Swiftgoma" }],
  creator: "Swiftgoma",
  publisher: "Swiftgoma",
  applicationName: "Swiftgoma",
  category: "shopping",
  alternates: {
    canonical: "/",
    languages: {
      fr: "/fr",
      en: "/en",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Swiftgoma",
    title: "Swiftgoma — Achats en ligne et livraison rapide et fiable",
    description:
      "Achetez, vendez et livrez avec Swiftgoma — la plateforme conçue pour la RDC et le Rwanda.",
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Swiftgoma — Achetez, Vendez, Livrez",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swiftgoma — Achats en ligne et livraison rapide et fiable",
    description:
      "Achetez, vendez et livrez avec Swiftgoma — la plateforme conçue pour la RDC et le Rwanda.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    // google: "votre-code-de-verification-google",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <FavoritesProvider>
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <TooltipProvider>
                      {children}
                      <ConsentBanner />
                    </TooltipProvider>
                  </ThemeProvider>
                </FavoritesProvider>
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </Toaster>
      </body>
    </html>
  );
}
