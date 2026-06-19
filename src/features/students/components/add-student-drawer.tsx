"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, SelectField } from "@/components/ui/field";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import { toast } from "@/components/ui/toast";

interface AddStudentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddStudentDrawer({ open, onOpenChange, onSuccess }: AddStudentDrawerProps) {
  const { addStudent, groups, teachers } = useEduGenie();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
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
      toast.success("تم إضافة الطالب بنجاح");
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add student.");
      toast.error("حدث خطأ أثناء إضافة الطالب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] max-h-[85vh] overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-semibold">{t.students.addTitle}</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-full p-2 hover:bg-muted transition-colors text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
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
            {error && <p className="text-sm text-red-500">{error}</p>}
            
            <div className="mt-4 flex justify-end gap-3 border-t pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  إلغاء
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {t.students.addBtn}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
