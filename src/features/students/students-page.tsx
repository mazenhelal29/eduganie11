"use client";

import { useMemo, useState, useEffect } from "react";
import { Archive, Search, UserPlus, ChevronRight, ChevronLeft, Pencil, X, Check, ScanLine, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/field";
import { useEduGenie } from "@/providers/edugenie-store";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useTranslation } from "@/providers/i18n-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "@/components/ui/toast";

const ITEMS_PER_PAGE = 50;

export function StudentsPage() {
  // Refresh data when this page is visible
  useDataRefresh();
  
  const { addStudent, editStudent, archiveStudent, groups, students, teachers, attendance, assignCard, cards } = useEduGenie();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assigningCardTo, setAssigningCardTo] = useState<{id: string, name: string} | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const { t } = useTranslation();

  const filteredStudents = useMemo(
    () => students.filter((student) => student.fullName.toLowerCase().includes(debouncedQuery.toLowerCase())),
    [debouncedQuery, students],
  );

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  const paginatedStudents = useMemo(
    () => filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredStudents, currentPage]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.students.addTitle}</h2>
        </div>
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const target = event.currentTarget;
            const form = new FormData(target);
            setFormError(null);
            setIsSubmitting(true);

            try {
              await addStudent({
                fullName: String(form.get("fullName") || ""),
                phone: String(form.get("phone") || ""),
                parentPhone: String(form.get("parentPhone") || ""),
                groupId: String(form.get("groupId") || "") || undefined,
                teacherId: String(form.get("teacherId") || "") || undefined,
                notes: String(form.get("notes") || ""),
                cardId: String(form.get("cardId") || "") || undefined,
              });
              target.reset();
              toast.success("تم إضافة الطالب بنجاح");
            } catch (error) {
              setFormError(error instanceof Error ? error.message : "Failed to add student.");
              toast.error("حدث خطأ أثناء إضافة الطالب");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Field name="fullName" label={t.students.fullName} required placeholder={t.students.fullNamePlaceholder} />
          <Field name="phone" label={t.students.phone} placeholder="+20..." />
          <Field name="parentPhone" label={t.students.parentPhone} placeholder="+20..." />
          <SelectField name="groupId" label={t.students.group}>
            <option value="">{t.students.noGroup}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </SelectField>
          <SelectField name="teacherId" label={t.teachers?.selectTeacher || "اختر المعلم"}>
            <option value="">{t.teachers?.noTeacher || "بدون معلم"}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.fullName} ({teacher.subject})
              </option>
            ))}
          </SelectField>
          <Field name="notes" label={t.students.notes} placeholder={t.students.notesPlaceholder} />
          <Field 
            name="cardId" 
            label="رقم البطاقة (QR/Barcode) - اختياري" 
            placeholder="مرر البطاقة هنا..." 
            type="text"
          />
          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
          <button
            className="focus-ring h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={isSubmitting}
          >
            {t.students.addBtn}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t.students.listTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.students.totalRecords.replace("{count}", String(students.length))}</p>
          </div>
          <label className="focus-within:ring-ring flex h-10 items-center gap-2 rounded-md border bg-background px-3 focus-within:ring-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder={t.students.searchPlaceholder}
            />
          </label>
        </div>
        <div className="space-y-6">
          {paginatedStudents.length ? (
            <>
              {Object.entries(
                paginatedStudents.reduce((acc, student) => {
                  const groupId = student.groupId || "unassigned";
                  if (!acc[groupId]) acc[groupId] = [];
                  acc[groupId].push(student);
                  return acc;
                }, {} as Record<string, typeof paginatedStudents>)
              ).map(([groupId, groupStudents]) => {
                const groupName = groupId === "unassigned" 
                  ? t.students.noGroup 
                  : groups.find((g) => g.id === groupId)?.name || t.students.noGroup;

                return (
                  <div key={groupId} className="space-y-3">
                    <h3 className="text-sm font-bold text-muted-foreground border-b pb-2 flex items-center justify-between">
                      <span>{groupName}</span>
                      <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{groupStudents.length} طلاب (في هذه الصفحة)</span>
                    </h3>
                    <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-muted/50">
                      {groupStudents.map((student) => {
                        const isEditing = editingStudentId === student.id;
                        const whatsappNumber = student.phone || student.parentPhone;
                        
                        if (isEditing) {
                          return (
                            <article key={student.id} className="rounded-md border p-3 bg-muted/20">
                              <form
                                className="grid gap-3"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const formData = new FormData(e.currentTarget);
                                  try {
                                    await editStudent(student.id, {
                                      fullName: String(formData.get("fullName") || ""),
                                      phone: String(formData.get("phone") || ""),
                                      parentPhone: String(formData.get("parentPhone") || ""),
                                      groupId: String(formData.get("groupId") || "") || undefined,
                                      teacherId: String(formData.get("teacherId") || "") || undefined,
                                      notes: String(formData.get("notes") || ""),
                                    });
                                    setEditingStudentId(null);
                                    toast.success("تم تعديل الطالب بنجاح");
                                  } catch {
                                    toast.error("حدث خطأ أثناء التعديل");
                                  }
                                }}
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <Field name="fullName" label={t.students.fullName} defaultValue={student.fullName} required />
                                  <Field name="phone" label={t.students.phone} defaultValue={student.phone} />
                                  <Field name="parentPhone" label={t.students.parentPhone} defaultValue={student.parentPhone} />
                                  <SelectField name="groupId" label={t.students.group} defaultValue={student.groupId || ""}>
                                    <option value="">{t.students.noGroup}</option>
                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                  </SelectField>
                                  <SelectField name="teacherId" label={t.teachers?.selectTeacher || "اختر المعلم"} defaultValue={student.teacherId || ""}>
                                    <option value="">بدون معلم</option>
                                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                                  </SelectField>
                                  <Field name="notes" label={t.students.notes} defaultValue={student.notes} />
                                </div>
                                <div className="flex gap-2 justify-end mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingStudentId(null)}
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
                            </article>
                          );
                        }

                        return (
                          <article key={student.id} className="rounded-md border p-3 transition-colors hover:bg-muted/30">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="truncate font-medium">{student.fullName}</h4>
                                  {whatsappNumber && (
                                    <a
                                      href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-500 hover:text-white"
                                      title="مراسلة عبر واتساب"
                                    >
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="14" 
                                        height="14" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                      >
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                      </svg>
                                    </a>
                                  )}
                                </div>
                                <p className="truncate text-sm text-muted-foreground">{whatsappNumber}</p>
                                <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                                  {student.teacherId && (
                                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-600">
                                      {teachers.find((t) => t.id === student.teacherId)?.fullName || "معلم غير معروف"}
                                    </span>
                                  )}
                                  <span className="rounded-md bg-muted px-2 py-0.5">
                                    {t.students.joinTime || "وقت الانضمام:"} {new Date(student.createdAt).toLocaleTimeString(
                                      t.common?.switchLang === "English" ? "ar-EG" : "en-US", 
                                      { hour: '2-digit', minute: '2-digit' }
                                    )}
                                  </span>
                                  {(() => {
                                    const studentAtt = attendance.filter(a => a.studentId === student.id);
                                    if (studentAtt.length === 0) return null;
                                    const present = studentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
                                    const rate = Math.round((present / studentAtt.length) * 100);
                                    return (
                                      <span className={`rounded-md px-2 py-0.5 ${rate >= 75 ? 'bg-emerald-500/10 text-emerald-600' : rate >= 50 ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                                        نسبة الالتزام: {rate}%
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                  onClick={() => setEditingStudentId(student.id)}
                                  type="button"
                                  title="تعديل"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                                  onClick={() => setAssigningCardTo({id: student.id, name: student.fullName})}
                                  type="button"
                                  title="ربط بطاقة سريعة"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </button>
                                <button
                                  className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                  onClick={async () => {
                                    if(confirm("هل أنت متأكد من أرشفة هذا الطالب؟")) {
                                      try {
                                        await archiveStudent(student.id);
                                        toast.success("تم أرشفة الطالب");
                                      } catch {
                                        toast.error("حدث خطأ أثناء الأرشفة");
                                      }
                                    }
                                  }}
                                  type="button"
                                  title={t.students.archiveLabel}
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4 mt-6">
                  <span className="text-sm text-muted-foreground">
                    صفحة {currentPage} من {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="focus-ring flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="focus-ring flex h-9 items-center justify-center gap-1 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState title={t.students.emptyTitle} description={t.students.emptyDesc} />
          )}
        </div>
      </section>
      {/* Quick Assign Card Modal */}
      {assigningCardTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
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
                } catch {
                  toast.error("حدث خطأ أثناء الربط. حاول مرة أخرى.");
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
