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
import { BRAND, SITE_URL } from "@/lib/brand";
import { DEFAULT_OG_IMAGE, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = `${BRAND.name} — ${BRAND.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  keywords: [...BRAND.keywords],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  applicationName: BRAND.name,
  category: "shopping",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND.name,
    title: defaultTitle,
    description: BRAND.shortDescription,
    locale: BRAND.ogLocale,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: BRAND.shortDescription,
    images: [DEFAULT_OG_IMAGE.url],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = [organizationJsonLd(), websiteJsonLd()];

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
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
                      <div className="flex min-h-dvh flex-1 flex-col">
                        {children}
                      </div>
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
