"use client";

import Link from "next/link";
import { Bell, Command, Plus, Search } from "lucide-react";
import { BottomNavigation } from "@/components/layouts/bottom-navigation";
import { SidebarNavigation } from "@/components/layouts/sidebar-navigation";
import { GlobalSearch } from "@/components/shared/global-search";
import { useTranslation } from "@/providers/i18n-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-dvh bg-background">
      <SidebarNavigation />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col pb-20 lg:pl-64 lg:pb-0">
        <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">{t.common.edugenie}</p>
              <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                {t.shell.centerOperations}
              </h1>
            </div>
            <GlobalSearch />
            <button
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-md border bg-card text-muted-foreground md:hidden"
              type="button"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/settings"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-md border bg-card text-muted-foreground sm:flex"
              aria-label="Command palette"
            >
              <Command className="h-5 w-5" />
            </Link>
            <Link
              href="/settings"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-md border bg-card text-muted-foreground sm:flex"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              href="/students"
              className="focus-ring flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-soft"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t.shell.quickAdd}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
      <BottomNavigation />
    </div>
  );
}
