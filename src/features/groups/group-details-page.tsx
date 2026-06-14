"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Users,
  TrendingUp,
  Clock,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Pencil,
  Archive,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import { toast } from "@/components/ui/toast";

export function GroupDetailsPage({ groupId }: { groupId: string }) {
  const { groups, students, attendance, payments, settings, teachers, editGroup, archiveGroup } = useEduGenie();
  const { t } = useTranslation();

  const group = groups.find((g) => g.id === groupId);
  const [isEditing, setIsEditing] = useState(false);
  const [editSchedule, setEditSchedule] = useState(group?.schedule || []);
  const [editTeacherId, setEditTeacherId] = useState(group?.teacherId || "");

  const targetMonth = useMemo(() => {
    const now = new Date();
    const billingModel = settings?.billingModel ?? "prepaid";
    const targetDate =
      billingModel === "postpaid"
        ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  }, [settings]);

  const groupStudents = useMemo(
    () => students.filter((s) => s.groupId === groupId && s.status === "active"),
    [students, groupId]
  );

  const teacher = useMemo(
    () => (group?.teacherId ? teachers.find((t) => t.id === group.teacherId) : null),
    [teachers, group]
  );

  const paidByStudentMonth = useMemo(
    () => new Set(payments.map((p) => `${p.studentId}:${p.forMonth}`)),
    [payments]
  );

  // Calculate attendance rate per student
  const attendanceByStudent = useMemo(() => {
    const map = new Map<string, { present: number; total: number }>();
    groupStudents.forEach((s) => {
      const records = attendance.filter(
        (a) => a.studentId === s.id && a.groupId === groupId
      );
      const present = records.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      map.set(s.id, { present, total: records.length });
    });
    return map;
  }, [attendance, groupStudents, groupId]);

  const isArabic =
    typeof window !== "undefined" && document.documentElement.dir === "rtl";

  // Group summary stats
  const totalPaid = groupStudents.filter((s) =>
    paidByStudentMonth.has(`${s.id}:${targetMonth}`)
  ).length;
  const totalUnpaid = groupStudents.length - totalPaid;
  const avgAttendance =
    groupStudents.length > 0
      ? Math.round(
          groupStudents.reduce((sum, s) => {
            const rec = attendanceByStudent.get(s.id);
            if (!rec || rec.total === 0) return sum;
            return sum + (rec.present / rec.total) * 100;
          }, 0) / groupStudents.filter((s) => (attendanceByStudent.get(s.id)?.total ?? 0) > 0).length || 0
        )
      : 0;

  // CSV Export
  const exportToCSV = () => {
    const headers = [
      "الاسم",
      "الهاتف",
      "هاتف ولي الأمر",
      "تاريخ الانضمام",
      "نسبة الحضور",
      "الاشتراك",
      "حالة الدفع",
    ];

    const rows = groupStudents.map((s) => {
      const rec = attendanceByStudent.get(s.id);
      const attendanceRate =
        rec && rec.total > 0
          ? `${Math.round((rec.present / rec.total) * 100)}%`
          : "لا يوجد سجلات";
      const subStatus =
        (rec?.total ?? 0) > 0
          ? rec!.present >= (group?.monthlySessions ?? 8) * 0.75
            ? "منتظم"
            : "غير منتظم"
          : "—";
      const payStatus = paidByStudentMonth.has(`${s.id}:${targetMonth}`)
        ? "مدفوع"
        : "غير مدفوع";
      return [
        s.fullName,
        s.phone || "—",
        s.parentPhone || "—",
        new Date(s.joinDate).toLocaleDateString("ar-EG"),
        attendanceRate,
        subStatus,
        payStatus,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${group?.name ?? "group"}_students.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!group) return null;

  const formatSchedule = () => {
    if (!Array.isArray(group.schedule) || group.schedule.length === 0)
      return "—";
    const daysMap = t.common.days as Record<string, string>;
    return group.schedule
      .map((s) => `${daysMap[s.dayOfWeek]} ${s.time}`)
      .join(" • ");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/groups"
            className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted"
            aria-label={t.groups.backToGroups}
          >
            {isArabic ? (
              <ArrowRight className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-md bg-accent/10 px-2 py-0.5 font-medium text-accent">
                {group.subject}
              </span>
              {teacher && (
                <>
                  <span>•</span>
                  <span>{teacher.fullName}</span>
                </>
              )}
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatSchedule()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="focus-ring flex shrink-0 items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.97]"
              >
                <Pencil className="h-4 w-4" />
                تعديل
              </button>
              <button
                onClick={async () => {
                  if(confirm("هل أنت متأكد من أرشفة هذه المجموعة؟ سيتم إخفاؤها من القوائم.")) {
                    try {
                      await archiveGroup(groupId);
                      toast.success("تم أرشفة المجموعة");
                      window.history.back();
                    } catch {
                      toast.error("حدث خطأ أثناء الأرشفة");
                    }
                  }
                }}
                className="focus-ring flex shrink-0 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 active:scale-[0.97]"
              >
                <Archive className="h-4 w-4" />
                أرشفة
              </button>
            </>
          )}
          <button
            onClick={exportToCSV}
            className="focus-ring flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-[0.97]"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form
          className="rounded-xl border bg-muted/20 p-5 shadow-inner grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            try {
              await editGroup(groupId, {
                name: String(form.get("name")),
                subject: String(form.get("subject")),
                teacherId: editTeacherId || undefined,
                schedule: editSchedule,
                capacity: Number(form.get("capacity")),
                monthlySessions: Number(form.get("monthlySessions")),
                monthlyPrice: Number(form.get("monthlyPrice")),
              });
              setIsEditing(false);
              toast.success("تم تعديل المجموعة بنجاح");
            } catch {
              toast.error("حدث خطأ أثناء التعديل");
            }
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">اسم المجموعة</label>
            <input name="name" defaultValue={group.name} required className="focus-ring h-10 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">المادة</label>
            <input name="subject" defaultValue={group.subject} required className="focus-ring h-10 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">المعلم</label>
            <select
              value={editTeacherId}
              onChange={(e) => setEditTeacherId(e.target.value)}
              className="focus-ring h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="">بدون معلم</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">السعة</label>
            <input type="number" name="capacity" defaultValue={group.capacity} required className="focus-ring h-10 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">حصص الشهر</label>
            <input type="number" name="monthlySessions" defaultValue={group.monthlySessions} required className="focus-ring h-10 w-full rounded-md border px-3 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">الاشتراك الشهري</label>
            <input type="number" name="monthlyPrice" defaultValue={group.monthlyPrice} required className="focus-ring h-10 w-full rounded-md border px-3 text-sm" />
          </div>
          
          <div className="col-span-full space-y-2 rounded-md border p-3 bg-card">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">المواعيد</label>
              <button
                type="button"
                onClick={() => setEditSchedule(prev => [...prev, { dayOfWeek: 0, time: "16:00" }])}
                className="text-xs font-medium text-primary flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> إضافة
              </button>
            </div>
            <div className="grid gap-2">
              {editSchedule.map((block, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    className="focus-ring h-9 rounded-md border px-3 text-sm"
                    value={block.dayOfWeek}
                    onChange={(e) => setEditSchedule(prev => prev.map((p, idx) => idx === i ? { ...p, dayOfWeek: Number(e.target.value) } : p))}
                  >
                    {Object.entries(t.common.days as Record<string, string>).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="focus-ring h-9 rounded-md border px-3 text-sm"
                    value={block.time}
                    onChange={(e) => setEditSchedule(prev => prev.map((p, idx) => idx === i ? { ...p, time: e.target.value } : p))}
                  />
                  <button type="button" onClick={() => setEditSchedule(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-full flex gap-2 justify-end mt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="flex h-10 items-center gap-2 rounded-md border px-4 font-medium transition hover:bg-muted">
              <X className="h-4 w-4" /> إلغاء
            </button>
            <button type="submit" className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground transition hover:bg-primary/90">
              <Save className="h-4 w-4" /> حفظ التعديلات
            </button>
          </div>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>إجمالي الطلاب</span>
          </div>
          <p className="text-2xl font-bold">
            {groupStudents.length}
            <span className="text-base font-normal text-muted-foreground">
              /{group.capacity}
            </span>
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>متوسط الحضور</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{avgAttendance}%</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>مدفوعون</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalPaid}</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            <span>غير مدفوعين</span>
          </div>
          <p className="text-2xl font-bold text-red-500">{totalUnpaid}</p>
        </div>
      </div>

      {/* Students Table */}
      <section className="rounded-xl border bg-card shadow-soft">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-semibold">طلاب المجموعة</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {groupStudents.length} طالب نشط — {targetMonth}
          </p>
        </div>

        {groupStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 opacity-30" />
            <div>
              <p className="font-medium">لا يوجد طلاب في هذه المجموعة</p>
              <p className="mt-1 text-sm">
                اذهب إلى صفحة الطلاب وعيّن طلاباً لهذه المجموعة.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">الطالب</th>
                  <th className="px-5 py-3">تاريخ الانضمام</th>
                  <th className="px-5 py-3">نسبة الحضور</th>
                  <th className="px-5 py-3">الاشتراك</th>
                  <th className="px-5 py-3">حالة الدفع</th>
                  <th className="px-5 py-3">تواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupStudents.map((student, index) => {
                  const rec = attendanceByStudent.get(student.id);
                  const attendanceRate =
                    rec && rec.total > 0
                      ? Math.round((rec.present / rec.total) * 100)
                      : null;

                  // Subscription regularity: >= 75% of monthly sessions
                  const minSessions = (group.monthlySessions ?? 8) * 0.75;
                  const isRegular =
                    rec && rec.total > 0
                      ? rec.present >= minSessions
                      : null;

                  const hasPaid = paidByStudentMonth.has(
                    `${student.id}:${targetMonth}`
                  );

                  const joinDateFormatted = new Date(
                    student.joinDate
                  ).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {/* Index */}
                      <td className="px-5 py-4 text-muted-foreground">
                        {index + 1}
                      </td>

                      {/* Name + phone */}
                      <td className="px-5 py-4">
                        <p className="font-semibold">{student.fullName}</p>
                        {student.phone && (
                          <p className="text-xs text-muted-foreground">
                            {student.phone}
                          </p>
                        )}
                      </td>

                      {/* Join Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{joinDateFormatted}</span>
                        </div>
                      </td>

                      {/* Attendance Rate */}
                      <td className="px-5 py-4">
                        {attendanceRate === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  attendanceRate >= 75
                                    ? "bg-emerald-500"
                                    : attendanceRate >= 50
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                                style={{ width: `${attendanceRate}%` }}
                              />
                            </div>
                            <span
                              className={`font-semibold ${
                                attendanceRate >= 75
                                  ? "text-emerald-600"
                                  : attendanceRate >= 50
                                  ? "text-amber-500"
                                  : "text-red-500"
                              }`}
                            >
                              {attendanceRate}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Subscription Regularity */}
                      <td className="px-5 py-4">
                        {isRegular === null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <AlertCircle className="h-3 w-3" />
                            لا يوجد
                          </span>
                        ) : isRegular ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            منتظم
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <AlertCircle className="h-3 w-3" />
                            غير منتظم
                          </span>
                        )}
                      </td>

                      {/* Payment Status */}
                      <td className="px-5 py-4">
                        {hasPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CreditCard className="h-3 w-3" />
                            مدفوع
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                            <XCircle className="h-3 w-3" />
                            غير مدفوع
                          </span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="px-5 py-4">
                        {(student.phone || student.parentPhone) ? (
                          <a
                            href={`https://wa.me/${(student.phone || student.parentPhone || "").replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-500 hover:text-white"
                            title="مراسلة عبر واتساب"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
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
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
