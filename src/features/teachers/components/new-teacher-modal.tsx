"use client";

import { useState } from "react";
import { X, User, Phone, BookOpen, Loader2 } from "lucide-react";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";

interface NewTeacherModalProps {
  onClose: () => void;
}

export function NewTeacherModal({ onClose }: NewTeacherModalProps) {
  const { addTeacher } = useEduGenie();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const subject = formData.get("subject") as string;
    const paymentType = formData.get("paymentType") as "percentage" | "fixed_salary" | "per_session";
    const rateStr = formData.get("rate") as string;
    const rate = rateStr ? Number(rateStr) : undefined;

    if (!fullName || !subject || !paymentType || rate === undefined) {
      setError("Please fill all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      await addTeacher({ fullName, phone, subject, paymentType, rate });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add teacher");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b p-3 sm:px-6 sm:py-4 shrink-0">
          <h2 className="text-xl font-semibold">{t.teachers.addTitle}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t.teachers.fullName} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                <input
                  type="text"
                  name="fullName"
                  required
                  autoFocus
                  placeholder={t.teachers.fullNamePlaceholder}
                  className="focus-ring h-11 w-full rounded-xl border border-input bg-background pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm transition-colors hover:border-accent/50 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t.teachers.subject} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder={t.teachers.subjectPlaceholder}
                  className="focus-ring h-11 w-full rounded-xl border border-input bg-background pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm transition-colors hover:border-accent/50 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t.teachers.phone}
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground rtl:left-3 rtl:right-auto" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="01xxxxxxxxx"
                  className="focus-ring h-11 w-full rounded-xl border border-input bg-background pl-4 pr-10 rtl:pl-10 rtl:pr-4 text-sm transition-colors hover:border-accent/50 focus:border-accent text-left rtl:text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Payment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentType"
                required
                className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-4 text-sm transition-colors hover:border-accent/50 focus:border-accent"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_salary">Fixed Monthly Salary</option>
                <option value="per_session">Per Session Rate</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Rate / Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="rate"
                required
                min="0"
                step="0.01"
                placeholder="e.g. 50"
                className="focus-ring h-11 w-full rounded-xl border border-input bg-background px-4 text-sm transition-colors hover:border-accent/50 focus:border-accent"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              {t.settings.logoutCancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.auth.login.submitting}
                </>
              ) : (
                t.teachers.addBtn
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
