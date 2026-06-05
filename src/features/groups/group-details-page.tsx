"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Save, CheckCircle2, Circle } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import type { AttendanceRecord } from "@/types/domain";

export function GroupDetailsPage({ groupId }: { groupId: string }) {
  const { groups, students, attendance, markGroupAttendance } = useEduGenie();
  const { t } = useTranslation();
  
  const group = groups.find((g) => g.id === groupId);
  const today = new Date().toISOString().slice(0, 10);

  // Stabilize groupStudents reference
  const groupStudents = useMemo(
    () => students.filter((s) => s.groupId === groupId && s.status === "active"),
    [students, groupId]
  );

  // Compute initial checklist without causing infinite loops
  const initialChecklist = useMemo(() => {
    const initial: Record<string, boolean> = {};
    groupStudents.forEach((student) => {
      const record = attendance.find((item) => item.studentId === student.id && item.attendedOn === today);
      initial[student.id] = record?.status === "present" || record?.status === "late";
    });
    return initial;
  }, [attendance, groupStudents, today]);

  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isSaved, setIsSaved] = useState(false);

  // Hydrate checklist when initialChecklist changes
  useEffect(() => {
    setChecklist(initialChecklist);
  }, [initialChecklist]);

  if (!group) return null;

  const toggleStudent = (studentId: string) => {
    setChecklist((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    const records = groupStudents.map((student) => ({
      studentId: student.id,
      status: (checklist[student.id] ? "present" : "absent") as AttendanceRecord["status"],
    }));
    
    markGroupAttendance(records);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isArabic = typeof window !== "undefined" && document.documentElement.dir === "rtl";
  const checkedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/groups"
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
          aria-label={t.groups.backToGroups}
        >
          {isArabic ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </Link>
        <div>
          <h2 className="text-2xl font-bold">{t.groups.groupDetails}: {group.name}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent">
              {group.subject}
            </span>
            <span>•</span>
            <span>
              {Array.isArray(group.schedule)
                ? group.schedule.map(s => `${(t.common.days as Record<string, string>)[s.dayOfWeek]} ${s.time}`).join("، ")
                : "—"}
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{t.groups.groupAttendance}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              {checkedCount} / {groupStudents.length}
            </span>
          </div>
        </div>

        {groupStudents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            {t.attendance.noStudents}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {groupStudents.map((student) => {
                const isChecked = checklist[student.id] || false;
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => toggleStudent(student.id)}
                    className={`focus-ring flex w-full items-center gap-3 rounded-lg border p-4 text-start transition-all active:scale-[0.98] ${
                      isChecked
                        ? "border-emerald-200 bg-emerald-50/50 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${isChecked ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {isChecked ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium transition-colors ${isChecked ? "text-emerald-900" : "text-foreground"}`}>
                        {student.fullName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-6">
              <button
                onClick={handleSave}
                className={`focus-ring flex w-full items-center justify-center gap-2 rounded-xl h-14 text-base font-semibold text-white shadow-soft transition-all active:scale-[0.98] sm:w-auto sm:min-w-[200px] sm:px-8 ${
                  isSaved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-primary hover:bg-primary/90"
                }`}
              >
                <Save className="h-5 w-5" />
                {isSaved ? t.groups.attendanceSaved : t.groups.saveAttendance}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
