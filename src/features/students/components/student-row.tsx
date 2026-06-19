"use client";

import { ChevronDown, ChevronRight, Phone } from "lucide-react";
import type { Student } from "@/types/domain";
import { useEduGenie } from "@/providers/edugenie-store";

interface StudentRowProps {
  student: Student;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export function StudentRow({ student, isExpanded, onToggle, index }: StudentRowProps) {
  const { groups, attendance } = useEduGenie();

  const group = groups.find((g) => g.id === student.groupId);
  const studentAtt = attendance.filter((a) => a.studentId === student.id);
  const present = studentAtt.filter((a) => a.status === "present" || a.status === "late").length;
  const rate = studentAtt.length ? Math.round((present / studentAtt.length) * 100) : null;

  const getAttendanceBadge = () => {
    if (rate === null) return <span className="text-muted-foreground text-xs">جديد</span>;
    if (rate >= 75) return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">{rate}%</span>;
    if (rate >= 50) return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">{rate}%</span>;
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{rate}%</span>;
  };

  const isEven = index % 2 === 0;

  return (
    <div 
      className={`group flex items-center justify-between p-4 cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/50 ${isEven ? 'bg-transparent' : 'bg-muted/10'} ${isExpanded ? 'bg-muted/30' : ''}`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        <div className="shrink-0 text-muted-foreground transition-transform duration-200">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5 rtl:rotate-180" />}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <div className="font-semibold text-foreground truncate md:w-1/3">
            {student.fullName}
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground md:w-1/4">
            <Phone className="h-3.5 w-3.5" />
            <span className="truncate">{student.phone || "---"}</span>
          </div>

          <div className="flex items-center gap-2 md:w-1/4">
            <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary/20 truncate">
              {group?.name || "بدون مجموعة"}
            </span>
          </div>

          <div className="flex items-center md:w-1/4">
            {getAttendanceBadge()}
          </div>
        </div>
      </div>
    </div>
  );
}
