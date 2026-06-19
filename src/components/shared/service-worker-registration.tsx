"use client";

import { useEffect } from "react";

// Define the type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // 1. Debugging: Check Environment and Protocol
    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const isHttps = window.location.protocol === "https:";
      
      console.log("[PWA DEBUG] Environment:", process.env.NODE_ENV);
      console.log("[PWA DEBUG] Is Localhost?", isLocalhost);
      console.log("[PWA DEBUG] Is HTTPS?", isHttps);

      if (!isLocalhost && !isHttps) {
        console.warn("[PWA DEBUG] 🚨 INSECURE CONTEXT DETECTED: Chrome will NOT allow PWA installation on non-secure (HTTP) networks unless it is exactly 'localhost'. Using an IP like 192.168.x.x will fail.");
      } else {
        console.log("[PWA DEBUG] Secure context validated.");
      }
    }

    // 2. Debugging: Capture BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      console.log("[PWA DEBUG] ✅ beforeinstallprompt fired! The app is 100% installable.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      console.log("[PWA DEBUG] 🚀 App was successfully installed!");
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 3. Register Service Worker (ONLY in production to prevent HMR dev conflicts)
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA DEBUG] ✅ Service Worker registered successfully with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA DEBUG] ❌ Service Worker registration failed:", error);
        });
    } else if (process.env.NODE_ENV !== "production") {
      console.log("[PWA DEBUG] ⚠️ Service Worker registration bypassed in development mode to avoid caching conflicts. Please run `npm run build && npm run start` to test installability.");
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
