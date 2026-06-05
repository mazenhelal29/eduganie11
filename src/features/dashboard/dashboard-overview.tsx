"use client";

import Link from "next/link";
import {
  Banknote,
  CalendarCheck,
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { formatCurrency } from "@/lib/utils";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";

export function DashboardOverview() {
  const { groups, metrics, students } = useEduGenie();
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">{t.dashboard.todayDate}</p>
            <h2 className="mt-1 text-2xl font-semibold text-card-foreground">{t.dashboard.todayGlance}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t.dashboard.todaySubtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-64">
            <Link
              href="/attendance"
              className="focus-ring rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              {t.dashboard.markAttendance}
            </Link>
            <Link
              href="/payments"
              className="focus-ring rounded-md border bg-background px-3 py-2 text-center text-sm font-medium"
            >
              {t.dashboard.addPayment}
            </Link>
          </div>
        </div>
      </section>

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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{t.dashboard.activeGroups}</h3>
              <p className="text-sm text-muted-foreground">{t.dashboard.capacityOverview}</p>
            </div>
            <Link href="/groups" className="focus-ring rounded-md border bg-background px-3 py-2 text-sm font-medium">
              {t.dashboard.newGroup}
            </Link>
          </div>
          <div className="space-y-3">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.dashboard.noGroups}</p>
            ) : (
              groups.map((group) => (
                <article key={group.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(group.schedule)
                          ? group.schedule.map(s => `${(t.common.days as Record<string, string>)[s.dayOfWeek]} ${s.time}`).join("، ")
                          : "—"}
                      </p>
                    </div>
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                      {students.filter((student) => student.groupId === group.id && student.status === "active").length}/{group.capacity}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{
                        width: `${Math.min(
                          (students.filter((student) => student.groupId === group.id && student.status === "active").length /
                            group.capacity) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4">
            <h3 className="font-semibold">{t.dashboard.studentFollowups}</h3>
            <p className="text-sm text-muted-foreground">{t.dashboard.recentRecords}</p>
          </div>
          <div className="space-y-3">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.dashboard.noStudents}</p>
            ) : (
              students.map((student) => (
                <article key={student.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-medium">{student.fullName}</h4>
                    <p className="truncate text-sm text-muted-foreground">{student.parentPhone}</p>
                  </div>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium capitalize">
                    {t.students[`status${student.status.charAt(0).toUpperCase() + student.status.slice(1)}` as keyof typeof t.students]}
                  </span>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
