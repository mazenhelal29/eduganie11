import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { ServiceWorkerRegistration } from "@/components/shared/service-worker-registration";
import { PWAInstallBanner } from "@/components/shared/pwa-install-banner";

export const metadata: Metadata = {
  title: "EduGenie",
  description: "نظام إدارة المراكز التعليمية",
  applicationName: "EduGenie",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "EduGenie",
    statusBarStyle: "black-translucent",
    startupImage: "/logo.jpg",
  },
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
    other: [
      { rel: "apple-touch-startup-image", url: "/logo.jpg" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#172554",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <AppProviders>
          {children}
          <ServiceWorkerRegistration />
          <PWAInstallBanner />
        </AppProviders>
      </body>
    </html>
  );
}
