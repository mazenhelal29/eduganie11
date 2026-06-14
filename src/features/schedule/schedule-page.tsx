"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import { Calendar, Clock, BookOpen, User, ArrowRight, ArrowLeft } from "lucide-react";

export function SchedulePage() {
  const router = useRouter();
  const { teachers, groups } = useEduGenie();
  const { t } = useTranslation();
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("edugenie.schedule.teacherId");
    if (saved) {
      setSelectedTeacherId(saved);
    }
  }, []);

  const handleTeacherChange = (id: string) => {
    setSelectedTeacherId(id);
    localStorage.setItem("edugenie.schedule.teacherId", id);
  };

  const isArabic = typeof window !== "undefined" && document.documentElement.dir === "rtl";

  // Get active teachers
  const activeTeachers = useMemo(() => teachers.filter(t => t.isActive), [teachers]);

  // If a teacher is selected, filter groups that belong to them
  const teacherGroups = useMemo(() => {
    if (!selectedTeacherId) return [];
    return groups.filter(g => g.teacherId === selectedTeacherId && g.isActive);
  }, [groups, selectedTeacherId]);

  // Organize schedules by day of week (0 = Sunday, 1 = Monday, etc.)
  const scheduleByDay = useMemo(() => {
    const daysMap = new Map<number, { groupName: string, time: string, capacity: number, enrolled: number }[]>();
    
    // Initialize empty arrays for 7 days
    for (let i = 0; i < 7; i++) {
      daysMap.set(i, []);
    }

    teacherGroups.forEach(group => {
      if (Array.isArray(group.schedule)) {
        group.schedule.forEach(sched => {
          const dayList = daysMap.get(sched.dayOfWeek);
          if (dayList) {
            dayList.push({
              groupName: group.name,
              time: sched.time,
              capacity: group.capacity,
              enrolled: group.enrolled || 0
            });
          }
        });
      }
    });

    // Sort times within each day
    daysMap.forEach(dayList => {
      dayList.sort((a, b) => a.time.localeCompare(b.time));
    });

    return daysMap;
  }, [teacherGroups]);

  const daysLabels = t.common.days as Record<string, string>;

  // Filter out days with no classes to make the UI cleaner
  const activeDays = Array.from({ length: 7 }, (_, i) => i).filter(i => (scheduleByDay.get(i)?.length || 0) > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 shadow-sm"
            aria-label="رجوع"
          >
            {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              جدول الحصص
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              استعرض ونظم جداول المعلمين بشكل أسبوعي
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 sm:p-6 shadow-card">
        <div className="max-w-md space-y-2 mb-8">
          <label className="text-sm font-semibold text-foreground">المعلم</label>
          <div className="relative">
            <select
              value={selectedTeacherId}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="focus-ring h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm font-medium transition-colors hover:border-primary/50 focus:border-primary shadow-sm"
            >
              <option value="" disabled>-- اختر المعلم لعرض جدوله --</option>
              {activeTeachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.fullName} ({teacher.subject})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>

        {selectedTeacherId ? (
          activeDays.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/10 py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-lg font-semibold text-foreground">لا توجد حصص مسجلة</p>
              <p className="mt-1 text-sm text-muted-foreground">لم يتم إضافة أي مجموعات في جدول هذا المعلم حتى الآن.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 lg:gap-8">
              {activeDays.map((i) => {
                const dayItems = scheduleByDay.get(i) || [];
                return (
                  <div key={i} className="group flex flex-col rounded-2xl border bg-background shadow-sm transition-all hover:shadow-card hover:border-primary/20 overflow-hidden">
                    <div className="bg-muted/30 px-5 py-3 border-b border-border/50 flex items-center justify-between transition-colors group-hover:bg-primary/5">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {daysLabels[i]}
                      </h3>
                      <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-1 rounded-md border shadow-sm">
                        {dayItems.length} حصص
                      </span>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                      {dayItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-xl border border-primary/10 bg-primary/[0.02] hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary">
                              <Clock className="h-4 w-4" />
                            </div>
                            <p className="font-bold text-base tracking-tight">{item.time}</p>
                          </div>
                          <div className="pl-10">
                            <p className="font-medium text-sm text-foreground flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              {item.groupName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/10 py-16 text-center">
            <div className="bg-background p-4 rounded-full shadow-sm border mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">يرجى تحديد المعلم</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">اختر معلماً من القائمة أعلاه لاستعراض جدول الحصص الأسبوعي الخاص به.</p>
          </div>
        )}
      </section>
    </div>
  );
}
