import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://admin.swiftgoma.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SwiftGoma Admin",
    template: "%s | SwiftGoma Admin",
  },
  description:
    "Tableau de bord d'administration SwiftGoma — gestion des vendeurs, commandes, abonnements et livraisons pour la marketplace de Goma, RDC.",
  applicationName: "SwiftGoma Admin",
  keywords: [
    "SwiftGoma",
    "admin",
    "Goma",
    "RDC",
    "marketplace",
    "e-commerce",
    "dashboard",
  ],
  authors: [{ name: "SwiftGoma" }],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    siteName: "SwiftGoma Admin",
    title: "SwiftGoma Admin",
    description:
      "Tableau de bord d'administration SwiftGoma — gestion des vendeurs, commandes, abonnements et livraisons.",
    url: siteUrl,
  },
  twitter: {
    card: "summary",
    title: "SwiftGoma Admin",
    description: "Tableau de bord d'administration SwiftGoma.",
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
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
