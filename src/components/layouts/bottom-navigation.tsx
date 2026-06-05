"use client";

import Link from "next/link";
import { navigationItems } from "@/constants/navigation";
import { useTranslation } from "@/providers/i18n-provider";

const mobileItems = navigationItems.slice(0, 5);

export function BottomNavigation() {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-soft lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileItems.map((item) => {
          // Resolve translation key dynamically
          const keys = item.labelKey.split('.');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const label = keys.reduce((obj: any, key) => obj?.[key], t) || item.labelKey;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring flex h-12 flex-col items-center justify-center rounded-md text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="mb-1 h-4 w-4" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

