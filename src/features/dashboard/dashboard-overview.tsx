"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Banknote,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  Users,
  MessageCircle,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/utils";
import { useEduGenie } from "@/providers/edugenie-store";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useTranslation } from "@/providers/i18n-provider";

export function DashboardOverview() {
  // Refresh data when dashboard is visible
  useDataRefresh();
  
  const { groups, metrics, students, payments, settings } = useEduGenie();
  const { t } = useTranslation();
  
  const unpaidStudents = useMemo(() => {
    const now = new Date();
    const billingModel = settings?.billingModel ?? "prepaid";
    const targetDate = billingModel === "postpaid"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;

    const paidByStudentMonth = new Set(payments.map((p) => `${p.studentId}:${p.forMonth}`));
    
    return students.filter(student => student.status === "active" && !paidByStudentMonth.has(`${student.id}:${targetMonth}`));
  }, [students, payments, settings]);

  const activeStudentCountByGroup = useMemo(() => {
    const counts = new Map<string, number>();

    students.forEach((student) => {
      if (student.status === "active" && student.groupId) {
        counts.set(student.groupId, (counts.get(student.groupId) || 0) + 1);
      }
    });

    return counts;
  }, [students]);

  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary/80 p-5 text-primary-foreground shadow-lg sm:p-6">
        {/* Decorative circles */}
        <div className="absolute -top-8 -start-8 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -end-4 h-56 w-56 rounded-full bg-white/5" />
        <div className="absolute top-4 end-16 h-20 w-20 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <p className="text-sm font-medium text-primary-foreground/80">{today}</p>
            </div>
            <h2 className="text-xl font-bold sm:text-2xl">{t.dashboard.todayGlance}</h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              {t.dashboard.todaySubtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:min-w-fit sm:flex-col">
            <Link
              href="/attendance"
              className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
            >
              <ClipboardCheck className="h-4 w-4" />
              {t.dashboard.markAttendance}
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
            >
              <Banknote className="h-4 w-4" />
              {t.dashboard.addPayment}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label={t.dashboard.totalStudents}
          value={String(metrics.totalStudents)}
          helper={t.dashboard.activeStudents.replace("{count}", String(metrics.activeStudents))}
          icon={Users}
        />
        <StatCard
          label={t.dashboard.todayAttendance}
          value={`${metrics.todayAttendanceRate}%`}
          helper={t.dashboard.attendanceLive}
          icon={ClipboardCheck}
          tone="accent"
        />
        <StatCard
          label={t.dashboard.monthlyRevenue}
          value={formatCurrency(metrics.monthlyRevenue)}
          helper={t.dashboard.collectedSubs}
          icon={Banknote}
        />
        <StatCard
          label={t.dashboard.monthlyExpenses}
          value={formatCurrency(metrics.monthlyExpenses)}
          helper={t.dashboard.expensesHelper}
          icon={TrendingUp}
          tone="warning"
        />
        <StatCard
          label={t.dashboard.netProfit}
          value={formatCurrency(metrics.netProfit)}
          helper={t.dashboard.netProfitHelper}
          icon={UserCheck}
          tone="accent"
        />
        <StatCard
          label={t.dashboard.overdue}
          value={String(metrics.overdueCount)}
          helper={t.dashboard.overdueHelper}
          icon={CalendarCheck}
          tone="danger"
        />
      </section>

      {/* Bottom Sections */}
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Active Groups */}
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div>
              <h3 className="font-bold text-foreground">{t.dashboard.activeGroups}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.dashboard.capacityOverview}</p>
            </div>
            <Link
              href="/groups"
              className="focus-ring flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              {t.dashboard.newGroup}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y p-2">
            {groups.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t.dashboard.noGroups}</p>
            ) : (
              groups.map((group) => {
                const count = activeStudentCountByGroup.get(group.id) || 0;
                const pct = Math.min((count / Math.max(group.capacity, 1)) * 100, 100);
                const isFull = pct >= 90;
                const isEmpty = pct === 0;

                return (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-all hover:bg-muted/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                      {group.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate font-semibold text-sm">{group.name}</h4>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isFull ? "bg-red-100 text-red-700" :
                          isEmpty ? "bg-muted text-muted-foreground" :
                          "bg-emerald-50 text-emerald-700"
                        }`}>
                          {count}/{group.capacity}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {Array.isArray(group.schedule)
                          ? group.schedule.map(s => `${(t.common.days as Record<string, string>)[s.dayOfWeek]} ${s.time}`).join("، ")
                          : "—"}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            isFull ? "bg-red-500" : "bg-accent"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Unpaid Students */}
        <div className="rounded-2xl border bg-card shadow-card">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100">
                <CalendarCheck className="h-4 w-4 text-red-600" />
              </span>
              <div>
                <h3 className="font-bold text-red-600">طلاب غير مدفوعين</h3>
                <p className="text-xs text-muted-foreground">{unpaidStudents.length} طالب لم يسدد</p>
              </div>
            </div>
          </div>
          <div className="max-h-[380px] divide-y overflow-y-auto">
            {unpaidStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <span className="text-3xl">🎉</span>
                <p className="font-medium text-sm text-foreground">جميع الطلاب سددوا!</p>
                <p className="text-xs text-muted-foreground">لا يوجد طلاب متأخرون</p>
              </div>
            ) : (
              unpaidStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-red-50/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">
                      {student.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold">{student.fullName}</h4>
                      <p className="truncate text-xs text-muted-foreground">{student.parentPhone}</p>
                    </div>
                  </div>
                  {student.parentPhone && (
                    <a
                      href={`https://wa.me/${student.parentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، نذكركم بموعد السداد الشهري للطالب ${student.fullName}.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white active:scale-95"
                      title="إرسال تذكير واتساب"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

