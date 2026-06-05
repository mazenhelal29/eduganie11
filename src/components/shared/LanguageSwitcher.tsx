"use client";

import { useTranslation } from "@/providers/i18n-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted px-1 py-1 text-xs font-medium">
      <button
        onClick={() => setLocale("ar")}
        className={`rounded-full px-3 py-1 transition-all duration-200 ${
          locale === "ar"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        العربية
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-full px-3 py-1 transition-all duration-200 ${
          locale === "en"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        English
      </button>
    </div>
  );
}
