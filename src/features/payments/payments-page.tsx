"use client";

import { useMemo } from "react";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { Field, SelectField } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";

export function PaymentsPage() {
  const { addPayment, payments, students, groups, settings } = useEduGenie();
  const { t } = useTranslation();

  const now = new Date();
  const billingModel = settings?.billingModel ?? "prepaid";

  // Compute target month based on billing model
  const targetDate =
    billingModel === "postpaid"
      ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
      : new Date(now.getFullYear(), now.getMonth(), 1);
  const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`;
  const targetMonthLabel = targetDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long" });

  // Current month as default for the form
  const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Compute unpaid students
  const unpaidStudents = useMemo(() => {
    const activeStudents = students.filter((s) => s.status === "active");
    return activeStudents.filter((student) => {
      const group = groups.find((g) => g.id === student.groupId);
      if (!group) return false;
      const paid = payments.some(
        (p) =>
          p.studentId === student.id &&
          p.forMonth === targetMonth &&
          p.amount >= (group.monthlyPrice || 1)
      );
      return !paid;
    });
  }, [students, groups, payments, targetMonth]);

  const activeStudents = students.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      {/* ── Unpaid Students Banner ───────────────────────── */}
      <section className="rounded-xl border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          {unpaidStudents.length === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
          <h2 className="text-lg font-semibold">{t.payments.unpaidTitle}</h2>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${unpaidStudents.length === 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
            {unpaidStudents.length === 0 ? t.payments.noUnpaid : `${unpaidStudents.length}`}
          </span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {unpaidStudents.length === 0
            ? t.payments.noUnpaid
            : t.payments.unpaidDesc.replace("{month}", targetMonthLabel)}
        </p>

        {unpaidStudents.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unpaidStudents.map((student) => {
              const group = groups.find((g) => g.id === student.groupId);
              return (
                <article
                  key={student.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{student.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{group?.name}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {formatCurrency(group?.monthlyPrice || 0)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Main Grid ────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        {/* Record Payment Form */}
        <section className="rounded-xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold">{t.payments.addTitle}</h2>
          </div>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              addPayment({
                studentId: String(form.get("studentId") || ""),
                amount: Number(form.get("amount") || 0),
                remainingBalance: Number(form.get("remainingBalance") || 0),
                forMonth: String(form.get("forMonth") || currentMonthValue),
              });
              event.currentTarget.reset();
            }}
          >
            <SelectField name="studentId" label={t.payments.student} required>
              <option value="">{t.payments.selectStudent}</option>
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </SelectField>
            <Field name="amount" label={t.payments.amount} type="number" min={0} required placeholder="800" />
            <Field name="remainingBalance" label={t.payments.remainingBalance} type="number" min={0} placeholder="0" />
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">{t.payments.forMonth}</label>
              <input
                name="forMonth"
                type="month"
                defaultValue={currentMonthValue}
                className="focus-ring h-10 w-full rounded-md border bg-background px-3 text-sm"
                required
              />
            </div>
            <button className="focus-ring h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
              {t.payments.saveBtn}
            </button>
          </form>
        </section>

        {/* Payment History */}
        <section className="rounded-xl border bg-card p-5 shadow-soft">
          <h2 className="text-lg font-semibold">{t.payments.listTitle}</h2>
          <div className="mt-4 space-y-3">
            {payments.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                <p className="font-medium">{t.payments.noPayments}</p>
                <p className="mt-1 text-sm">{t.payments.noPaymentsDesc}</p>
              </div>
            ) : (
              payments.map((payment) => {
                const student = students.find((s) => s.id === payment.studentId);
                return (
                  <article key={payment.id} className="rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{student?.fullName || t.payments.unknownStudent}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t.payments.forMonth}: {payment.forMonth || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.payments.paidAt}: {payment.paidAt}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-700">{formatCurrency(payment.amount)}</p>
                        {payment.remainingBalance > 0 && (
                          <p className="text-xs text-red-500">
                            {t.payments.remainingBalance}: {formatCurrency(payment.remainingBalance)}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
