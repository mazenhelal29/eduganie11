"use client";

import Link from "next/link";
import { Bell, Plus, Search } from "lucide-react";
import { BottomNavigation } from "@/components/layouts/bottom-navigation";
import { SidebarNavigation } from "@/components/layouts/sidebar-navigation";
import { GlobalSearch } from "@/components/shared/global-search";
import { useTranslation } from "@/providers/i18n-provider";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-background">
      <SidebarNavigation />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col pb-24 lg:pr-64 lg:pb-0">
        {/* Premium Header */}
        <header className="sticky top-0 z-20 border-b bg-card/90 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Title */}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">{t.common.edugenie}</p>
              <h1 className="truncate text-base font-bold text-foreground sm:text-lg">
                {t.shell.centerOperations}
              </h1>
            </div>

            {/* Search - Desktop */}
            <div className="hidden min-w-0 flex-1 justify-center md:flex">
              <GlobalSearch />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search icon - Mobile */}
              <Link
                href="/students"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary md:hidden"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Link>

              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Notifications */}
              <Link
                href="/settings"
                className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow">
                  3
                </span>
              </Link>

              {/* Quick Add CTA */}
              <Link
                href="/students"
                className="focus-ring flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t.shell.quickAdd}</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
      <BottomNavigation />
    </div>
  );
}

