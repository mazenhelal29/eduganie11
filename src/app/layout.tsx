import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";
import { PWAInstallBanner } from "@/components/shared/pwa-install-banner";
import { SplashScreen } from "@/components/shared/splash-screen";

export const metadata: Metadata = {
  title: "EduGenie",
  description: "نظام إدارة المراكز التعليمية",
  applicationName: "EduGenie",
  appleWebApp: {
    capable: true,
    title: "EduGenie",
    statusBarStyle: "black-translucent",
    startupImage: "/logo.jpg",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/logo.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpg",
    apple: [
      { url: "/logo.jpg", sizes: "180x180", type: "image/jpeg" },
    ],
    other: [
      { rel: "apple-touch-startup-image", url: "/logo.jpg" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#172554" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#172554" />
        
        {/* iOS PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EduGenie" />
        {/* MS Tile for Windows */}
        <meta name="msapplication-TileColor" content="#172554" />
        <meta name="msapplication-TileImage" content="/logo.jpg" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body>
        <AppProviders>
          <SplashScreen />
          {children}
          <ServiceWorkerRegistration />
          <PWAInstallBanner />
        </AppProviders>
      </body>
    </html>
  );
}
