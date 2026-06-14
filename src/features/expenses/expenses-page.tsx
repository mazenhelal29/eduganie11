"use client";

import { useState } from "react";
import { WalletCards } from "lucide-react";
import { Field, SelectField } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { useEduGenie } from "@/providers/edugenie-store";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { useTranslation } from "@/providers/i18n-provider";

export function ExpensesPage() {
  // Refresh data when this page is visible
  useDataRefresh();
  
  const { addExpense, expenses } = useEduGenie();
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.expenses.addTitle}</h2>
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
              await addExpense({
                category: form.get("category") as "rent" | "salaries" | "utilities" | "miscellaneous",
                amount: Number(form.get("amount") || 0),
                notes: String(form.get("notes") || ""),
              });
              target.reset();
            } catch (error) {
              setFormError(error instanceof Error ? error.message : "Failed to save expense.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <SelectField name="category" label={t.expenses.category} required>
            <option value="rent">{t.expenses.rent}</option>
            <option value="salaries">{t.expenses.salaries}</option>
            <option value="utilities">{t.expenses.utilities}</option>
            <option value="miscellaneous">{t.expenses.miscellaneous}</option>
          </SelectField>
          <Field name="amount" label={t.expenses.amount} type="number" min={0} required placeholder="2500" />
          <Field name="notes" label={t.expenses.notes} placeholder={t.expenses.notesPlaceholder} />
          {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
          <button
            className="focus-ring h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={isSubmitting}
          >
            {t.expenses.saveBtn}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{t.expenses.listTitle}</h2>
        <div className="mt-4 space-y-3">
          {expenses.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
              <p className="font-medium">{t.expenses.noExpenses}</p>
              <p className="mt-1 text-sm">{t.expenses.noExpensesDesc}</p>
            </div>
          ) : (
            expenses.map((expense) => (
              <article key={expense.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium capitalize">{t.expenses[expense.category]}</h3>
                    <p className="text-sm text-muted-foreground">{expense.notes || expense.spentAt}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
