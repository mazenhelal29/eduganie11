"use client";

import { useEffect } from "react";
import { toast } from "@/components/ui/toast";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Skip SW registration in development to prevent cache conflicts with HMR
    if (process.env.NODE_ENV === "development") {
      // Unregister any existing SW in dev mode
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      // Clear all caches in dev mode
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      return;
    }

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Check for updates periodically
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available - quietly update
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Auto-reload when new SW takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });

      } catch (err) {
        console.warn("SW registration failed:", err);
      }
    };

    // Register immediately in all environments for PWA testing
    register();

    // Online/offline status feedback
    const handleOnline = () => toast.success("اتصال الإنترنت عاد ✅");
    const handleOffline = () => toast.warning("أنت في وضع عدم الاتصال 📶");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
