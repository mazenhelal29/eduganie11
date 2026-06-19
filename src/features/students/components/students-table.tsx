"use client";

import { useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Student } from "@/types/domain";
import { StudentRow } from "./student-row";
import { StudentDetailsCard } from "./student-details-card";

interface StudentsTableProps {
  students: Student[];
  onEdit: (studentId: string) => void;
  onDelete: (studentId: string) => void;
  onAssignCard: (studentId: string, name: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
}

export function StudentsTable({ students, onEdit, onDelete, onAssignCard, fetchNextPage, hasNextPage }: StudentsTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Use a dynamic height estimation for the virtualizer because expanded rows are taller
  const virtualizer = useVirtualizer({
    count: students.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => {
      // Base row is ~72px, expanded adds ~300px
      const isExpanded = students[index]?.id === expandedId;
      return isExpanded ? 380 : 72;
    },
    overscan: 5,
  });

  // Automatically recalculate sizes when expanded state changes
  useEffect(() => {
    virtualizer.measure();
  }, [expandedId, virtualizer]);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed">
        <p className="text-lg font-medium text-muted-foreground">لا يوجد طلاب</p>
        <p className="text-sm text-muted-foreground mt-1">جرب تغيير الفلاتر أو إضافة طالب جديد</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Table Header (Desktop only) */}
      <div className="hidden md:flex items-center px-4 py-3 bg-muted/40 border-b text-sm font-semibold text-muted-foreground">
        <div className="w-9" /> {/* Spacer for chevron */}
        <div className="flex-1 flex gap-4">
          <div className="w-1/3">الاسم</div>
          <div className="w-1/4">رقم الهاتف</div>
          <div className="w-1/4">المجموعة</div>
          <div className="w-1/4">الالتزام</div>
        </div>
      </div>

      {/* Virtualized List Container */}
      <div 
        ref={parentRef} 
        className="flex-1 overflow-auto relative custom-scrollbar"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow: any) => {
            const student = students[virtualRow.index];
            if (!student) return null;
            
            const isExpanded = expandedId === student.id;

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <StudentRow
                  student={student}
                  index={virtualRow.index}
                  isExpanded={isExpanded}
                  onToggle={() => setExpandedId(isExpanded ? null : student.id)}
                />
                
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <StudentDetailsCard
                      student={student}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAssignCard={onAssignCard}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
