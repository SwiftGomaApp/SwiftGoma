import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { getServerLocale } from "@/lib/language";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LoginRequiredProvider } from "@/lib/auth/login-required-context";
import { CartProvider } from "@/lib/cart/cart-context";
import { NotificationsProvider } from "@/lib/notifications/notifications-context";
import { SessionExpiredModal } from "@/components/global/session-expired";
import { LogoutOverlay } from "@/components/global/logout-overlay";
import { ServerUnreachableBanner } from "@/lib/auth/server-unreachable-banner";
import { Toaster } from "@/components/ui/toast";
import { LegalConsentProvider } from "@/components/legal/legal-consent-provider";
import { cn } from "@/lib/utils";
import { FavoritesProvider } from "@/lib/favorites/favorites-context";
import { OneSignalProvider } from "@/components/global/onesignal-provider";
import { OrderDetailsProvider } from "@/components/account/order-details-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://swiftgoma.com";
const SITE_NAME = "SwiftGoma";
const SITE_DESCRIPTION =
  "SwiftGoma is Goma's local marketplace and delivery platform — buy and sell from trusted local sellers, with fast delivery across the city.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Local Marketplace & Delivery in Goma`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "SwiftGoma",
    "Goma marketplace",
    "delivery Goma",
    "buy and sell Goma",
    "DRC online marketplace",
    "livraison Goma",
    "marché en ligne Goma",
  ],
  authors: [{ name: "SwiftGoma" }],
  creator: "SwiftGoma",
  publisher: "SwiftGoma",
  applicationName: SITE_NAME,
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      fr: "/fr",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["fr_FR"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Local Marketplace & Delivery in Goma`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png", // 1200x630, put in /public
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Local Marketplace & Delivery in Goma`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Add after verifying with Google Search Console / Bing Webmaster Tools
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistMono.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LoginRequiredProvider>
              <CartProvider>
                <FavoritesProvider>
                  <NotificationsProvider>
                    <OrderDetailsProvider>
                      <ServerUnreachableBanner />
                      <OneSignalProvider />
                      {children}
                      <Toaster />
                      <SessionExpiredModal />
                      <LogoutOverlay />
                      <LegalConsentProvider />
                    </OrderDetailsProvider>
                  </NotificationsProvider>
                </FavoritesProvider>
              </CartProvider>
            </LoginRequiredProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
