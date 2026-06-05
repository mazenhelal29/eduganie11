"use client";

import Image from "next/image";
import Link from "next/link";
import { navigationItems } from "@/constants/navigation";
import { useTranslation } from "@/providers/i18n-provider";

export function SidebarNavigation() {
  const { t } = useTranslation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card px-4 py-5 lg:block">
      <div className="mb-8 flex flex-col items-center justify-center text-center">
        <Image src="/logo.jpg" alt="EduGenie Logo" width={80} height={80} className="rounded-2xl object-cover shadow-sm" />
        <p className="mt-4 text-lg font-bold text-primary">{t.common.edugenie}</p>
        <p className="text-xs text-muted-foreground">{t.nav.mvpWorkspace}</p>
      </div>
      <nav className="space-y-1">
        {navigationItems.map((item) => {
          // Resolve translation key dynamically
          const keys = item.labelKey.split('.');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const label = keys.reduce((obj: any, key) => obj?.[key], t) || item.labelKey;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

