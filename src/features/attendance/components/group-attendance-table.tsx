"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Check, X, Loader2 } from "lucide-react";
import type { Student } from "@/types/domain";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import { toast } from "@/components/ui/toast";

interface StudentAttendanceData {
  student: Student;
  record: { status: string } | null;
  monthlyRate: number;
  termRate: number;
}

interface GroupAttendanceTableProps {
  studentsData: StudentAttendanceData[];
  groupId: string;
}

const columnHelper = createColumnHelper<StudentAttendanceData>();

function AttendanceRow({ 
  row, 
  handleMark, 
  isPending 
}: { 
  row: any, 
  handleMark: (id: string, status: "present" | "absent") => void, 
  isPending: boolean 
}) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const student = row.original.student;
  const status = row.original.record?.status;

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isHovered || isPending) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleMark(student.id, "present");
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleMark(student.id, "absent");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHovered, isPending, student.id, handleMark]);

  const rowBg = status === "present" ? "bg-emerald-50/50" : status === "absent" ? "bg-red-50/50" : "bg-background";
  const hoverBg = status === "present" ? "hover:bg-emerald-50" : status === "absent" ? "hover:bg-red-50" : "hover:bg-muted/50";

  return (
    <tr 
      className={`border-b transition-colors ${rowBg} ${hoverBg}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {row.getVisibleCells().map((cell: any) => (
        <td key={cell.id} className="p-4 align-middle">
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  );
}

export function GroupAttendanceTable({ studentsData, groupId }: GroupAttendanceTableProps) {
  const { t } = useTranslation();
  const { markAttendance, markGroupAttendance } = useEduGenie();
  
  const [pendingStudentId, setPendingStudentId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleMarkAttendance = async (studentId: string, status: "present" | "absent") => {
    setPendingStudentId(studentId);
    try {
      await markAttendance(studentId, status);
      toast.success(status === "present" ? "تم تسجيل الحضور" : "تم تسجيل الغياب");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل");
    } finally {
      setPendingStudentId(null);
    }
  };

  const handleBulkAction = async (status: "present" | "absent") => {
    setIsBulkLoading(true);
    try {
      const records = studentsData.map(d => ({ studentId: d.student.id, status }));
      await markGroupAttendance(records);
      toast.success(`تم تسجيل الكل ${status === "present" ? "حضور" : "غياب"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء التسجيل الجماعي");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor("student.fullName", {
      header: "اسم الطالب",
      cell: (info) => (
        <span className="font-semibold text-foreground whitespace-nowrap">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("record.status", {
      header: "الحالة",
      cell: (info) => {
        const status = info.getValue();
        if (!status) return <span className="text-muted-foreground text-sm">لم يسجل</span>;
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === "present" ? "bg-emerald-100 text-emerald-800" :
            status === "late" ? "bg-amber-100 text-amber-800" :
            "bg-red-100 text-red-800"
          }`}>
            {t.attendance[status as "present" | "late" | "absent"]}
          </span>
        );
      },
    }),
    columnHelper.accessor("monthlyRate", {
      header: "الالتزام الشهري",
      cell: (info) => {
        const rate = info.getValue();
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${rate > 75 ? "bg-emerald-500" : rate > 50 ? "bg-amber-500" : "bg-red-500"}`} 
                style={{ width: `${rate}%` }} 
              />
            </div>
            <span className="text-sm font-medium">{rate}%</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("termRate", {
      header: "الالتزام الكلي",
      cell: (info) => {
        const rate = info.getValue();
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${rate > 75 ? "bg-emerald-500" : rate > 50 ? "bg-amber-500" : "bg-red-500"}`} 
                style={{ width: `${rate}%` }} 
              />
            </div>
            <span className="text-sm font-medium">{rate}%</span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "الإجراء",
      cell: (info) => {
        const student = info.row.original.student;
        const status = info.row.original.record?.status;
        const isPending = pendingStudentId === student.id || isBulkLoading;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAttendance(student.id, "present")}
              disabled={isPending}
              title="تسجيل حضور (أو اضغط A عند التأشير)"
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                status === "present" 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              } disabled:opacity-50`}
            >
              <Check className="h-3.5 w-3.5" /> حضور
            </button>
            <button
              onClick={() => handleMarkAttendance(student.id, "absent")}
              disabled={isPending}
              title="تسجيل غياب (أو اضغط S عند التأشير)"
              className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors ${
                status === "absent" 
                  ? "bg-red-600 text-white shadow-sm" 
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
              } disabled:opacity-50`}
            >
              <X className="h-3.5 w-3.5" /> غياب
            </button>
          </div>
        );
      },
    }),
  ], [t, pendingStudentId, isBulkLoading]);

  const table = useReactTable({
    data: studentsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col rounded-md border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b bg-muted/20">
        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          إجراءات سريعة للمجموعة
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBulkAction("present")}
            disabled={isBulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            {isBulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            تسجيل الكل حضور
          </button>
          <button
            onClick={() => handleBulkAction("absent")}
            disabled={isBulkLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {isBulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            تسجيل الكل غياب
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-4 font-semibold text-muted-foreground whitespace-nowrap text-right">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <AttendanceRow 
                key={row.id} 
                row={row} 
                handleMark={handleMarkAttendance} 
                isPending={pendingStudentId === row.original.student.id || isBulkLoading} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
