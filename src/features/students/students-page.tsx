"use client";

import { useState } from "react";
import { useTranslation } from "@/providers/i18n-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useEduGenie } from "@/providers/edugenie-store";
import { toast } from "@/components/ui/toast";
import { FiltersBar } from "./components/filters-bar";
import { StudentsTable } from "./components/students-table";
import { AddStudentDrawer } from "./components/add-student-drawer";
import { useStudentsQuery } from "./hooks/use-students-query";
import { ScanLine, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export function StudentsPage() {
  const { t } = useTranslation();
  const { archiveStudent, assignCard, cards } = useEduGenie();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [sortBy, setSortBy] = useState<"name" | "attendance">("name");
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [assigningCardTo, setAssigningCardTo] = useState<{ id: string; name: string } | null>(null);

  // Data fetching
  const { data, isLoading, isError, refetch } = useStudentsQuery({
    page,
    pageSize,
    searchQuery: debouncedQuery,
    groupId,
    attendanceFilter,
    sortBy,
  });

  const students = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handlers
  const handleEdit = (studentId: string) => {
    // We would open an edit drawer here, similar to add drawer.
    // For MVP, we can show a toast or implement it later.
    toast.error("سيتم إضافة ميزة تعديل الطالب في لوحة جانبية قريباً");
  };

  const handleDelete = async (studentId: string) => {
    if (confirm("هل أنت متأكد من أرشفة هذا الطالب؟")) {
      try {
        await archiveStudent(studentId);
        toast.success("تم أرشفة الطالب بنجاح");
        refetch();
      } catch (error) {
        toast.error("حدث خطأ أثناء الأرشفة");
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
      
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
        groupId={groupId}
        onGroupChange={(val) => { setGroupId(val); setPage(1); }}
        attendanceFilter={attendanceFilter}
        onAttendanceChange={(val) => { setAttendanceFilter(val); setPage(1); }}
        sortBy={sortBy}
        onSortChange={(val) => { setSortBy(val); setPage(1); }}
        onAddStudent={() => setIsAddDrawerOpen(true)}
        totalCount={totalCount}
      />

      <div className="flex-1 min-h-0 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 bg-card rounded-xl border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border text-red-500">
            <p>حدث خطأ أثناء تحميل بيانات الطلاب</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-muted rounded-md text-foreground">إعادة المحاولة</button>
          </div>
        ) : (
          <>
            <StudentsTable
              students={students}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAssignCard={(id, name) => setAssigningCardTo({ id, name })}
            />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <span className="text-sm text-muted-foreground">
                  صفحة {page} من {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="focus-ring flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="focus-ring flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddStudentDrawer 
        open={isAddDrawerOpen} 
        onOpenChange={setIsAddDrawerOpen} 
        onSuccess={() => refetch()}
      />

      {/* Quick Assign Card Modal */}
      {assigningCardTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-2">ربط بطاقة ذكية</h3>
            <p className="text-xl text-primary font-medium mb-6">{assigningCardTo.name}</p>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-300 mb-6 relative overflow-hidden group">
              <ScanLine className="w-16 h-16 mx-auto text-primary mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-slate-600 font-medium">قم بتمرير البطاقة على القارئ الآن...</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const cardId = (new FormData(form).get("cardId") as string).trim();
                if (!cardId) return;

                const cardInUse = cards[cardId];
                if (cardInUse && cardInUse.studentId && cardInUse.studentId !== assigningCardTo.id && cardInUse.status === 'active') {
                  toast.error("هذه البطاقة مستخدمة مسبقاً لطالب آخر!");
                  form.reset();
                  return;
                }

                try {
                  await assignCard(cardId, assigningCardTo.id);
                  toast.success("تم ربط البطاقة بنجاح!");
                  setAssigningCardTo(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء الربط. حاول مرة أخرى.");
                  form.reset();
                }
              }}>
                <input name="cardId" autoFocus className="opacity-0 absolute inset-0 cursor-default" autoComplete="off" />
                <button type="submit" className="hidden">Submit</button>
              </form>
            </div>
            <button
              onClick={() => setAssigningCardTo(null)}
              className="w-full py-3 border-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
