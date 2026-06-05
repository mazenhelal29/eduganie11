"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, CalendarDays, Clock, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import type { Group } from "@/types/domain";

export function DailyTasksPage() {
  const { groups, students, attendance } = useEduGenie();
  const { t } = useTranslation();

  const isArabic = typeof window !== "undefined" && document.documentElement.dir === "rtl";
  const todayDate = new Date();
  const currentDayOfWeek = todayDate.getDay(); // 0-6
  const todayStr = todayDate.toISOString().slice(0, 10);
  const dayName = (t.common.days as Record<string, string>)[currentDayOfWeek.toString()];

  // Filter groups that have a schedule block for today
  const todaysGroups = useMemo(() => {
    const matched: Array<{ group: Group; time: string }> = [];
    groups.forEach((g) => {
      if (Array.isArray(g.schedule)) {
        g.schedule.forEach((s) => {
          if (s.dayOfWeek === currentDayOfWeek) {
            matched.push({ group: g, time: s.time });
          }
        });
      }
    });
    // Sort chronologically by time
    return matched.sort((a, b) => a.time.localeCompare(b.time));
  }, [groups, currentDayOfWeek]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t.dailyTasks.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.dailyTasks.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm">
          <CalendarDays className="h-5 w-5 text-accent" />
          <span className="font-semibold text-accent">{dayName}</span>
          <span className="text-sm font-medium text-muted-foreground ml-2 border-l pl-2 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2">
            {todayDate.toLocaleDateString(isArabic ? "ar-EG" : "en-US", { month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {todaysGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-16 px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{t.dailyTasks.noTasks}</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {t.dailyTasks.noTasksDesc}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {todaysGroups.map(({ group, time }, index) => {
            const groupStudents = students.filter((s) => s.groupId === group.id && s.status === "active");
            // Check how many attended today
            const attendedToday = groupStudents.filter(
              (student) => attendance.some(a => a.studentId === student.id && a.attendedOn === todayStr && (a.status === "present" || a.status === "late"))
            ).length;
            const progress = groupStudents.length ? Math.round((attendedToday / groupStudents.length) * 100) : 0;
            const isCompleted = groupStudents.length > 0 && progress === 100;

            return (
              <article
                key={`${group.id}-${index}`}
                className="group relative overflow-hidden rounded-2xl border border-accent/10 bg-gradient-to-br from-card to-accent/5 p-1 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {/* Accent glow on hover */}
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-accent/10 blur-3xl transition-opacity group-hover:bg-accent/20"></div>

                {/* Left Time Indicator */}
                <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-accent to-accent/60 rtl:left-auto rtl:right-0"></div>

                <div className="flex flex-col sm:flex-row sm:items-center rounded-xl bg-card/50 backdrop-blur-sm p-4 gap-4 relative z-10 border border-white/5">
                  {/* Time & Subject */}
                  <div className="flex items-center gap-4 sm:w-48 sm:shrink-0 rtl:pr-2 ltr:pl-2">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-inner">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xl font-black tracking-tight">{time}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">{group.subject}</p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-border sm:h-12 sm:w-px sm:bg-border/50 hidden sm:block"></div>

                  {/* Group Info & Attendance Progress */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate mb-2 text-foreground/90">{group.name}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                        <Users className="h-4 w-4" />
                        <span>{groupStudents.length} {t.nav.students}</span>
                      </div>
                      <div className="flex-1 max-w-[150px]">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className={isCompleted ? "text-emerald-600" : "text-muted-foreground"}>
                            {progress}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted shadow-inner overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-accent/80 to-accent"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 sm:mt-0 sm:shrink-0 flex items-center justify-end">
                    <Link
                      href={`/groups/${group.id}`}
                      className={`focus-ring relative overflow-hidden flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all active:scale-95 ${
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] border border-primary/20"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : null}
                      <span>{t.dailyTasks.markAttendance}</span>
                      {isArabic ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
