"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Users, Phone, BookOpen, Pencil, Archive, X, Check } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useTranslation } from "@/providers/i18n-provider";
import { NewTeacherModal } from "./components/new-teacher-modal";
import { toast } from "@/components/ui/toast";

export function TeachersPage() {
  // Refresh data when this page is visible
  useDataRefresh();
  
  const { teachers, editTeacher, archiveTeacher } = useEduGenie();
  const { t } = useTranslation();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  const filteredTeachers = useMemo(() => {
    return teachers
      .filter((teacher) => teacher.isActive)
      .filter((teacher) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          teacher.fullName.toLowerCase().includes(q) ||
          teacher.subject.toLowerCase().includes(q) ||
          teacher.phone.includes(q)
        );
      });
  }, [teachers, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t.teachers.listTitle}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t.teachers.totalRecords.replace("{count}", filteredTeachers.length.toString())}
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          {t.teachers.addBtn}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
        <input
          type="text"
          placeholder={t.teachers.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus-ring h-11 w-full rounded-xl border border-input bg-card pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm transition-all hover:border-accent/50 focus:border-accent"
        />
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-16 px-4 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{t.teachers.emptyTitle}</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            {t.teachers.emptyDesc}
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="mt-6 font-medium text-accent hover:underline"
          >
            {t.teachers.addBtn}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => {
            const isEditing = editingTeacherId === teacher.id;

            if (isEditing) {
              return (
                <div key={teacher.id} className="group relative overflow-hidden rounded-2xl border bg-muted/20 p-5 shadow-sm">
                  <form
                    className="grid gap-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      try {
                        await editTeacher(teacher.id, {
                          fullName: String(formData.get("fullName") || ""),
                          phone: String(formData.get("phone") || ""),
                          subject: String(formData.get("subject") || ""),
                        });
                        setEditingTeacherId(null);
                        toast.success("تم التعديل بنجاح");
                      } catch {
                        toast.error("حدث خطأ أثناء حفظ المعلم");
                      }
                    }}
                  >
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t.teachers.fullName || "الاسم"}</label>
                        <input name="fullName" defaultValue={teacher.fullName} required className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t.teachers.subject || "المادة"}</label>
                        <input name="subject" defaultValue={teacher.subject} required className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t.teachers.phone || "رقم الهاتف"}</label>
                        <input name="phone" defaultValue={teacher.phone} className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTeacherId(null)}
                        className="flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        <X className="h-4 w-4" /> إلغاء
                      </button>
                      <button
                        type="submit"
                        className="flex h-9 items-center justify-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Check className="h-4 w-4" /> حفظ
                      </button>
                    </div>
                  </form>
                </div>
              );
            }

            return (
              <div
                key={teacher.id}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <span className="text-lg font-bold">{teacher.fullName.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{teacher.fullName}</h3>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingTeacherId(teacher.id)}
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      title="تعديل"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if(confirm("هل أنت متأكد من أرشفة هذا المعلم؟")) {
                          try {
                            await archiveTeacher(teacher.id);
                            toast.success("تم الأرشفة بنجاح");
                          } catch {
                            toast.error("حدث خطأ أثناء الأرشفة");
                          }
                        }
                      }}
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="أرشفة"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{teacher.subject}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewModalOpen && (
        <NewTeacherModal onClose={() => setIsNewModalOpen(false)} />
      )}
    </div>
  );
}
