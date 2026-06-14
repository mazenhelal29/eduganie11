"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed check
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Show banner after 3 seconds
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setShow(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!show || installed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-sm rounded-2xl bg-[#172554] shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 pb-3">
          {/* App Icon */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="EduGenie" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-lg leading-tight">EduGenie</p>
            <p className="text-blue-200 text-sm mt-0.5">ثبّت التطبيق على شاشتك الرئيسية</p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Features */}
        <div className="px-4 pb-3 flex gap-3">
          {["يعمل بدون إنترنت", "تسجيل حضور سريع", "مثل تطبيق حقيقي"].map((f) => (
            <span key={f} className="flex-1 text-center text-[11px] text-blue-300 bg-white/5 rounded-lg py-1.5 font-medium">
              {f}
            </span>
          ))}
        </div>

        {/* Install Button */}
        <div className="p-4 pt-1">
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 bg-white text-[#172554] font-black py-3.5 rounded-xl text-base shadow-lg active:scale-[0.98] transition-transform"
          >
            <Download className="w-5 h-5" />
            تثبيت التطبيق مجاناً
          </button>
        </div>
      </div>
    </div>
  );
}
