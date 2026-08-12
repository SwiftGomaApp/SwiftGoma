import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SocketProvider } from "@/providers/socket-provider";
import { NotificationsProvider } from "@/providers/notifications-provider";
import { ConfirmDialogProvider } from "@/components/admin/confirm-dialog";
import { ADMIN_BRAND, ADMIN_SITE_URL } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_SITE_URL),
  title: {
    default: ADMIN_BRAND.appName,
    template: `%s | ${ADMIN_BRAND.appName}`,
  },
  description: ADMIN_BRAND.description,
  applicationName: ADMIN_BRAND.appName,
  authors: [{ name: ADMIN_BRAND.name }],
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
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: ADMIN_BRAND.locale,
    siteName: ADMIN_BRAND.appName,
    title: ADMIN_BRAND.appName,
    description: ADMIN_BRAND.shortDescription,
    url: ADMIN_SITE_URL,
  },
  twitter: {
    card: "summary",
    title: ADMIN_BRAND.appName,
    description: ADMIN_BRAND.shortDescription,
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
          <Toaster>
            <ConfirmDialogProvider>
              <TooltipProvider>
                <AuthProvider>
                  <SocketProvider>
                    <NotificationsProvider>{children}</NotificationsProvider>
                  </SocketProvider>
                </AuthProvider>
              </TooltipProvider>
            </ConfirmDialogProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
