"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users, Phone, BookOpen, AlertCircle } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import { NewTeacherModal } from "./components/new-teacher-modal";

export function TeachersPage() {
  const { teachers } = useEduGenie();
  const { t } = useTranslation();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter((teacher) => teacher.isActive)
      .filter((teacher) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          teacher.fullName.toLowerCase().includes(q) ||
          teacher.subject.toLowerCase().includes(q) ||
          teacher.phone.includes(q)
        );
      });
  }, [teachers, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t.teachers.listTitle}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.teachers.totalRecords.replace("{count}", filteredTeachers.length.toString())}
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t.teachers.addBtn}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
        <input
          type="text"
          placeholder={t.teachers.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus-ring h-11 w-full rounded-xl border border-input bg-card pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm transition-all hover:border-accent/50 focus:border-accent"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-16 px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{t.teachers.emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {t.teachers.emptyDesc}
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="mt-6 font-medium text-accent hover:underline"
          >
            {t.teachers.addBtn}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => (
            <div
              key={teacher.id}
              className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <span className="text-lg font-bold">{teacher.fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{teacher.fullName}</h3>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 shrink-0" />
                  <span className="truncate">{teacher.subject}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{teacher.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isNewModalOpen && (
        <NewTeacherModal onClose={() => setIsNewModalOpen(false)} />
      )}
    </div>
  );
}
