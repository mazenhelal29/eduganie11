"use client";

import { useMemo, useState } from "react";
import { Archive, Search, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, SelectField } from "@/components/ui/field";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";

export function StudentsPage() {
  const { addStudent, archiveStudent, groups, students, teachers } = useEduGenie();
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filteredStudents = useMemo(
    () => students.filter((student) => student.fullName.toLowerCase().includes(query.toLowerCase())),
    [query, students],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.students.addTitle}</h2>
        </div>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            addStudent({
              fullName: String(form.get("fullName") || ""),
              phone: String(form.get("phone") || ""),
              parentPhone: String(form.get("parentPhone") || ""),
              groupId: String(form.get("groupId") || "") || undefined,
              teacherId: String(form.get("teacherId") || "") || undefined,
              notes: String(form.get("notes") || ""),
            });
            event.currentTarget.reset();
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
          <button className="focus-ring h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
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
        <div className="space-y-3">
          {filteredStudents.length ? (
            filteredStudents.map((student) => (
              <article key={student.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{student.fullName}</h3>
                    <p className="truncate text-sm text-muted-foreground">{student.phone || student.parentPhone}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-accent">
                        {groups.find((group) => group.id === student.groupId)?.name || t.students.noGroup}
                      </span>
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
                    </div>
                  </div>
                  <button
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground"
                    onClick={() => archiveStudent(student.id)}
                    type="button"
                    aria-label={t.students.archiveLabel}
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState title={t.students.emptyTitle} description={t.students.emptyDesc} />
          )}
        </div>
      </section>
    </div>
  );
}
