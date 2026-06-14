"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/constants/navigation";
import { useTranslation } from "@/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-1px_8px_rgba(15,23,42,0.08)] backdrop-blur-md lg:hidden">
      <div className="flex gap-0.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navigationItems.map((item) => {
          const keys = item.labelKey.split(".");
          const label = keys.reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], t) as string || item.labelKey;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-ring relative flex h-14 min-w-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-0 rounded-xl bg-primary/8" />
              )}
              <span
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center transition-transform duration-200",
                  active && "scale-110"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              </span>
              <span className={cn("relative max-w-full truncate text-[10px] font-medium leading-none", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

