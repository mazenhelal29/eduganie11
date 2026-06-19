"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import type { Student } from "@/types/domain";
import { GroupAttendanceTable } from "./components/group-attendance-table";

export function AttendancePage() {
  const { attendance, groups, students } = useEduGenie();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);

  const activeStudents = useMemo(() => {
    return students.filter((student) => 
      student.status === "active" && 
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const attendanceByStudent = useMemo(() => {
    const records = new Map<string, typeof attendance>();
    attendance.forEach((record) => {
      const current = records.get(record.studentId);
      if (current) current.push(record);
      else records.set(record.studentId, [record]);
    });
    return records;
  }, [attendance]);

  const todayAttendanceByStudent = useMemo(() => {
    const records = new Map<string, (typeof attendance)[number]>();
    attendance.forEach((record) => {
      if (record.attendedOn === today) records.set(record.studentId, record);
    });
    return records;
  }, [attendance, today]);

  const calculateRates = (studentId: string, monthlySessions: number = 8) => {
    const termSessions = monthlySessions * 4;
    const studentRecords = (attendanceByStudent.get(studentId) || []).filter(
      (r) => r.status === "present" || r.status === "late",
    );
    
    const monthlyAttended = studentRecords.filter((r) => r.attendedOn.startsWith(currentMonth)).length;
    const termAttended = studentRecords.length;

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
      .map(([groupId, stds]) => ({
        group: groups.find((g) => g.id === groupId) || null,
        students: stds,
      }))
      .filter((g) => g.students.length > 0);
  }, [activeStudents, groups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  };

  if (students.filter(s => s.status === "active").length === 0) {
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
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Global Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">{t.attendance.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t.attendance.subtitle.replace("{date}", today)}</p>
          <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            💡 <span>تلميح: مرر الماوس فوق اسم الطالب واضغط <kbd className="font-mono bg-background border px-1 rounded">A</kbd> للحضور أو <kbd className="font-mono bg-background border px-1 rounded">S</kbd> للغياب</span>
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            placeholder="البحث عن طالب..."
          />
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        {groupedStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl bg-card">
            لا توجد نتائج مطابقة للبحث
          </div>
        ) : (
          groupedStudents.map(({ group, students }) => {
            const monthlySessions = group?.monthlySessions || 8;
            const groupId = group?.id || "unassigned";
            const isExpanded = expandedGroups.has(groupId);
            
            // Map students to required table data format
            const studentsData = students.map(student => {
              const record = todayAttendanceByStudent.get(student.id);
              const { monthlyRate, termRate } = calculateRates(student.id, monthlySessions);
              return {
                student,
                record: record ? { status: record.status } : null,
                monthlyRate,
                termRate
              };
            });

            return (
              <section key={groupId} className="rounded-xl border bg-card shadow-sm overflow-hidden transition-all duration-200">
                <button
                  onClick={() => toggleGroup(groupId)}
                  className={`w-full flex items-center justify-between p-4 md:p-5 text-right transition-colors hover:bg-muted/30 ${isExpanded ? 'bg-muted/10 border-b' : ''}`}
                >
                  <div>
                    <h3 className="text-lg font-bold">{group?.name || t.attendance.noGroup}</h3>
                    {group && (
                      <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                        {group.subject} • {t.groups.monthlySessions}: {monthlySessions}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold ring-1 ring-inset ring-primary/20">
                      {students.length} طلاب
                    </span>
                    <div className={`p-1.5 rounded-md bg-background border shadow-sm transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                    <GroupAttendanceTable studentsData={studentsData} groupId={groupId} />
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
