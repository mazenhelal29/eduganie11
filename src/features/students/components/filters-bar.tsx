"use client";

import { Search, Filter, Plus } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "@/providers/i18n-provider";
import { useEduGenie } from "@/providers/edugenie-store";

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  groupId: string | null;
  onGroupChange: (groupId: string | null) => void;
  attendanceFilter: "all" | "high" | "medium" | "low";
  onAttendanceChange: (val: "all" | "high" | "medium" | "low") => void;
  sortBy: "name" | "attendance";
  onSortChange: (val: "name" | "attendance") => void;
  onAddStudent: () => void;
  totalCount: number;
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  groupId,
  onGroupChange,
  // attendanceFilter and onAttendanceChange kept in interface for future use
  sortBy,
  onSortChange,
  onAddStudent,
  totalCount,
}: FiltersBarProps) {
  const { t } = useTranslation();
  const { groups } = useEduGenie();

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.students.listTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {t.students.totalRecords.replace("{count}", String(totalCount))}
          </p>
        </div>
        <button
          onClick={onAddStudent}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold shadow hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t.students.addTitle}</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder={t.students.searchPlaceholder}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Group Filter Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors">
              <Filter className="h-4 w-4" />
              المجموعة
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="z-50 min-w-[200px] rounded-md border bg-popover p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                <DropdownMenu.RadioGroup value={groupId || "all"} onValueChange={(val) => onGroupChange(val === "all" ? null : val)}>
                  <DropdownMenu.RadioItem value="all" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                    الكل
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="unassigned" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                    بدون مجموعة
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-muted" />
                  {groups.map(group => (
                    <DropdownMenu.RadioItem key={group.id} value={group.id} className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                      {group.name}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Sort Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors">
              الترتيب
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="z-50 min-w-[150px] rounded-md border bg-popover p-1 shadow-md">
                <DropdownMenu.RadioGroup value={sortBy} onValueChange={(val: string) => onSortChange(val as "name" | "attendance")}>
                  <DropdownMenu.RadioItem value="name" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-accent">
                    الاسم
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem value="attendance" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-3 text-sm outline-none hover:bg-accent">
                    الالتزام (قريباً)
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>
  );
}
