"use client";

import { Phone, BookOpen, Clock, PenSquare, Trash2, Link } from "lucide-react";
import type { Student } from "@/types/domain";
import { useEduGenie } from "@/providers/edugenie-store";

interface StudentDetailsCardProps {
  student: Student;
  onEdit: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  onAssignCard: (studentId: string, studentName: string) => void;
}

export function StudentDetailsCard({ student, onEdit, onDelete, onAssignCard }: StudentDetailsCardProps) {
  const { groups, teachers, attendance } = useEduGenie();

  const group = groups.find((g) => g.id === student.groupId);
  const teacher = teachers.find((t) => t.id === student.teacherId);
  const studentAtt = attendance.filter((a) => a.studentId === student.id);
  const present = studentAtt.filter((a) => a.status === "present" || a.status === "late").length;
  const rate = studentAtt.length ? Math.round((present / studentAtt.length) * 100) : null;

  return (
    <div className="bg-muted/30 rounded-xl p-4 md:p-6 border border-border mt-2 animate-in slide-in-from-top-2 duration-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4" /> التواصل
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">الطالب:</span> {student.phone || "غير متوفر"}</p>
              <p><span className="font-medium">ولي الأمر:</span> {student.parentPhone || "غير متوفر"}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" /> البيانات الدراسية
            </h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">المجموعة:</span> {group?.name || "بدون مجموعة"}</p>
              <p><span className="font-medium">المعلم:</span> {teacher?.fullName || "بدون معلم"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" /> الالتزام
            </h4>
            <div className="text-sm">
              {rate !== null ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <span className="font-semibold">{rate}%</span>
                </div>
              ) : (
                <span className="text-muted-foreground">لا يوجد سجل حضور</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">ملاحظات</h4>
            <p className="text-sm bg-background p-3 rounded-md border min-h-[60px]">
              {student.notes || <span className="text-muted-foreground italic">لا توجد ملاحظات</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
        <button
          onClick={() => onEdit(student.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border hover:bg-muted transition-colors text-sm font-medium"
        >
          <PenSquare className="h-4 w-4" /> تعديل البيانات
        </button>
        <button
          onClick={() => onAssignCard(student.id, student.fullName)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium"
        >
          <Link className="h-4 w-4" /> ربط بطاقة
        </button>
        <button
          onClick={() => onDelete(student.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium mr-auto"
        >
          <Trash2 className="h-4 w-4" /> أرشفة
        </button>
      </div>
    </div>
  );
}
