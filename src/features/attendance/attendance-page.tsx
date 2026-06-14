"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import type { Student } from "@/types/domain";
import { toast } from "@/components/ui/toast";

export function AttendancePage() {
  const { attendance, groups, markAttendance, students } = useEduGenie();
  const { t } = useTranslation();
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const activeStudents = useMemo(
    () => students.filter((student) => student.status === "active"),
    [students],
  );
  const attendanceByStudent = useMemo(() => {
    const records = new Map<string, typeof attendance>();

    attendance.forEach((record) => {
      const current = records.get(record.studentId);
      if (current) {
        current.push(record);
      } else {
        records.set(record.studentId, [record]);
      }
    });

    return records;
  }, [attendance]);
  const todayAttendanceByStudent = useMemo(() => {
    const records = new Map<string, (typeof attendance)[number]>();

    attendance.forEach((record) => {
      if (record.attendedOn === today) {
        records.set(record.studentId, record);
      }
    });

    return records;
  }, [attendance, today]);

  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    setActionError(null);
    setPendingStudentId(studentId);

    try {
      await markAttendance(studentId, status);
      toast.success(status === "present" ? "تم تسجيل الحضور" : "تم تسجيل الغياب");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to save attendance.");
      toast.error("حدث خطأ أثناء تسجيل الحضور");
    } finally {
      setPendingStudentId(null);
    }
  };

  const calculateRates = (studentId: string, monthlySessions: number = 8) => {
    const termSessions = monthlySessions * 4;
    const studentRecords = (attendanceByStudent.get(studentId) || []).filter(
      (r) => r.status === "present" || r.status === "late",
    );
    
    const monthlyAttended = studentRecords.filter((r) => r.attendedOn.startsWith(currentMonth)).length;
    const termAttended = studentRecords.length; // Simplified for MVP

    const monthlyRate = Math.min(Math.round((monthlyAttended / monthlySessions) * 100), 100) || 0;
    const termRate = Math.min(Math.round((termAttended / termSessions) * 100), 100) || 0;

    return { monthlyRate, termRate };
  };

  const groupedStudents = useMemo(() => {
    const map = new Map<string, Student[]>();
    groups.forEach((g) => map.set(g.id, []));
    map.set("unassigned", []);

    activeStudents.forEach((student) => {
      const key = student.groupId || "unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(student);
    });

    return Array.from(map.entries())
      .map(([groupId, students]) => ({
        group: groups.find((g) => g.id === groupId) || null,
        students,
      }))
      .filter((g) => g.students.length > 0);
  }, [activeStudents, groups]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  if (activeStudents.length === 0) {
    return (
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{t.attendance.title}</h2>
          <p className="text-sm text-muted-foreground">{t.attendance.subtitle.replace("{date}", today)}</p>
        </div>
        <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          <p className="font-medium">{t.attendance.noStudents}</p>
          <p className="mt-1 text-sm">{t.attendance.noStudentsDesc}</p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t.attendance.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t.attendance.subtitle.replace("{date}", today)}</p>
        {actionError ? <p className="mt-2 text-sm text-red-500">{actionError}</p> : null}
      </div>

      {groupedStudents.map(({ group, students }) => {
        const monthlySessions = group?.monthlySessions || 8;
        const groupId = group?.id || "unassigned";
        const isExpanded = expandedGroups.has(groupId);

        return (
          <section key={groupId} className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <button
              onClick={() => toggleGroup(groupId)}
              className="w-full flex items-center justify-between p-5 text-right transition-colors hover:bg-muted/30"
            >
              <div>
                <h3 className="text-lg font-semibold">{group?.name || t.attendance.noGroup}</h3>
                {group && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {group.subject} • {t.groups.monthlySessions}: {monthlySessions}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                  {students.length} طلاب
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border/50 p-5 pt-4 space-y-3 bg-muted/5">
                {students.map((student) => {
                  const record = todayAttendanceByStudent.get(student.id);
                  const { monthlyRate, termRate } = calculateRates(student.id, monthlySessions);

                  return (
                    <article key={student.id} className="rounded-lg border bg-card p-3 hover:border-primary/20 transition-colors shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="truncate font-medium text-base">{student.fullName}</h4>
                            {record && (
                              <span className={`text-xs px-2 py-0.5 rounded-md ${record.status === "present" ? "bg-emerald-100 text-emerald-800" : record.status === "late" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                                {t.attendance[record.status as "present" | "late" | "absent"]}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{t.attendance.monthlyRate}:</span>
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${monthlyRate > 75 ? "bg-emerald-500" : monthlyRate > 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${monthlyRate}%` }} />
                                </div>
                                <span className="font-medium">{monthlyRate}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{t.attendance.termRate}:</span>
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${termRate > 75 ? "bg-emerald-500" : termRate > 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${termRate}%` }} />
                                </div>
                                <span className="font-medium">{termRate}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:shrink-0">
                          <button
                            className={`focus-ring flex h-10 w-24 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                              record?.status === "present" 
                                ? "bg-emerald-600 text-white shadow-sm" 
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                            onClick={() => handleMarkAttendance(student.id, "present")}
                            disabled={pendingStudentId === student.id}
                            type="button"
                          >
                            <Check className="h-4 w-4" />
                            حضور
                          </button>
                          <button
                            className={`focus-ring flex h-10 w-24 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${
                              record?.status === "absent" 
                                ? "bg-red-600 text-white shadow-sm" 
                                : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            }`}
                            onClick={() => handleMarkAttendance(student.id, "absent")}
                            disabled={pendingStudentId === student.id}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                            غياب
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
