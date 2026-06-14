"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/constants/navigation";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function SidebarNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 border-l bg-card lg:flex lg:flex-col" style={{ borderColor: "hsl(var(--border))" }}>
      {/* Logo area */}
      <div className="flex flex-col items-center justify-center border-b px-4 py-6" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="relative">
          <Image
            src="/logo.jpg"
            alt="EduGenie Logo"
            width={64}
            height={64}
            className="rounded-2xl object-cover shadow-card ring-2 ring-primary/10"
          />
          <span className="absolute -bottom-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white" />
          </span>
        </div>
        <p className="mt-3 text-base font-bold text-primary">{t.common.edugenie}</p>
        <p className="text-[11px] font-medium text-muted-foreground">{t.nav.mvpWorkspace}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navigationItems.map((item) => {
            const keys = item.labelKey.split(".");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const label = keys.reduce((obj: any, key) => obj?.[key], t) || item.labelKey;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "focus-ring relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-0 start-0 w-0.5 rounded-e-full bg-primary" />
                  )}
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-center text-[10px] text-muted-foreground">
          EduGenie • {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}

