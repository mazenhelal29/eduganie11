"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Plus, Trash2, Clock } from "lucide-react";
import { Field } from "@/components/ui/field";
import { useEduGenie } from "@/providers/edugenie-store";
import { useTranslation } from "@/providers/i18n-provider";
import type { GroupSchedule } from "@/types/domain";

export function GroupsPage() {
  const { addGroup, groups, students } = useEduGenie();
  const { t } = useTranslation();
  
  const [schedule, setSchedule] = useState<GroupSchedule[]>([{ dayOfWeek: 0, time: "16:00" }]);

  const addScheduleBlock = () => setSchedule((prev) => [...prev, { dayOfWeek: 0, time: "16:00" }]);
  const updateScheduleBlock = (index: number, field: keyof GroupSchedule, value: string | number) => {
    setSchedule((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };
  const removeScheduleBlock = (index: number) => {
    if (schedule.length > 1) {
      setSchedule((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const formatSchedule = (sched: GroupSchedule[]) => {
    if (!sched || sched.length === 0) return "—";
    const daysMap = t.common.days as Record<string, string>;
    return sched.map(s => `${daysMap[s.dayOfWeek]} ${s.time}`).join("، ");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold">{t.groups.createTitle}</h2>
        </div>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            addGroup({
              name: String(form.get("name") || ""),
              subject: String(form.get("subject") || ""),
              schedule: schedule,
              capacity: Number(form.get("capacity") || 0),
              monthlySessions: Number(form.get("monthlySessions") || 8),
              monthlyPrice: Number(form.get("monthlyPrice") || 0),
            });
            event.currentTarget.reset();
            setSchedule([{ dayOfWeek: 0, time: "16:00" }]);
          }}
        >
          <Field name="name" label={t.groups.groupName} required placeholder={t.groups.groupNamePlaceholder} />
          <Field name="subject" label={t.groups.subject} required placeholder={t.groups.subjectPlaceholder} />
          
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t.groups.schedule}</label>
              <button
                type="button"
                onClick={addScheduleBlock}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
              >
                <Plus className="h-3 w-3" />
                إضافة موعد
              </button>
            </div>
            <div className="grid gap-2">
              {schedule.map((block, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="focus-ring h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={block.dayOfWeek}
                    onChange={(e) => updateScheduleBlock(i, "dayOfWeek", Number(e.target.value))}
                  >
                    {Object.entries(t.common.days as Record<string, string>).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    className="focus-ring h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={block.time}
                    onChange={(e) => updateScheduleBlock(i, "time", e.target.value)}
                    required
                  />
                  {schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleBlock(i)}
                      className="p-2 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Field name="capacity" label={t.groups.capacity} type="number" min={1} required placeholder="30" />
          <Field name="monthlySessions" label={t.groups.monthlySessions} type="number" min={1} required placeholder={t.groups.monthlySessionsPlaceholder} />
          <Field name="monthlyPrice" label={t.groups.monthlyPrice} type="number" min={0} required placeholder={t.groups.monthlyPricePlaceholder} />
          <button className="focus-ring mt-2 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
            {t.groups.createBtn}
          </button>
        </form>
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">{t.groups.listTitle}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {groups.length === 0 ? (
            <div className="col-span-full rounded-md border border-dashed p-6 text-center text-muted-foreground">
              <p className="font-medium">{t.groups.noGroups}</p>
              <p className="mt-1 text-sm">{t.groups.noGroupsDesc}</p>
            </div>
          ) : (
            groups.map((group) => {
              const enrolled = students.filter((student) => student.groupId === group.id && student.status === "active").length;
              return (
                <Link key={group.id} href={`/groups/${group.id}`} className="focus-ring block rounded-md transition-colors hover:bg-muted/50">
                  <article className="rounded-md border p-3 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.subject}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{formatSchedule(group.schedule)}</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium shrink-0">
                        {enrolled}/{group.capacity}
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.min((enrolled / group.capacity) * 100, 100)}%` }} />
                    </div>
                  </article>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
