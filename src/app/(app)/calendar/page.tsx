"use client";

import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { AlarmClock, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { t } from "@/lib/copy";
import { friendlyDay, timeLabel, ymd } from "@/lib/dates";
import { ideaLabel, useIdeas, useReminders, useTasks } from "@/lib/hooks";
import { effectiveRemindAt } from "@/lib/repo";
import { useApp } from "@/components/app-provider";
import { ReminderItem, TaskRow } from "@/components/cards";
import { TopBar } from "@/components/shell";
import { Button, Card, cx, EmptyState, IconButton } from "@/components/ui";

export default function CalendarPage() {
  const tasks = useTasks();
  const reminders = useReminders();
  const ideas = useIdeas();
  const { openTaskEditor } = useApp();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const today = ymd(new Date());

  // Dated tasks appear on their local due date; reminders on their own alert date (CAL-01).
  const byDay = useMemo(() => {
    const m = new Map<string, { tasks: number; reminders: number }>();
    const bump = (d: string, k: "tasks" | "reminders") => {
      const v = m.get(d) ?? { tasks: 0, reminders: 0 };
      v[k]++;
      m.set(d, v);
    };
    for (const x of tasks ?? []) if (x.due_date) bump(x.due_date, "tasks");
    for (const r of reminders ?? []) bump(ymd(new Date(effectiveRemindAt(r))), "reminders");
    return m;
  }, [tasks, reminders]);

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const dayTasks = (tasks ?? []).filter((x) => x.due_date === selected).sort((a, b) => (a.due_time ?? "99").localeCompare(b.due_time ?? "99"));
  const dayReminders = (reminders ?? [])
    .filter((r) => ymd(new Date(effectiveRemindAt(r))) === selected)
    .map((r) => ({ r, task: tasks?.find((x) => x.id === r.task_id) }))
    .filter((x) => x.task);
  const ideaTitle = (id: string | null) => {
    const i = id ? ideas?.find((x) => x.id === id) : undefined;
    return i ? ideaLabel(i) : undefined;
  };

  return (
    <>
      <TopBar title={t("calendar.title")} />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <Card className="p-4 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold" aria-live="polite">
              {format(month, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <IconButton label={t("calendar.prev")} onClick={() => setMonth((m) => addMonths(m, -1))}>
                <ChevronLeft className="size-5" />
              </IconButton>
              <Button
                variant="ghost"
                className="px-3"
                onClick={() => {
                  setMonth(startOfMonth(new Date()));
                  setSelected(today);
                }}
              >
                {t("calendar.today")}
              </Button>
              <IconButton label={t("calendar.next")} onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight className="size-5" />
              </IconButton>
            </div>
          </div>
          <div role="grid" className="grid grid-cols-7 gap-1 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} role="columnheader" className="pb-2 text-xs font-semibold text-muted">
                {d}
              </div>
            ))}
            {days.map((d) => {
              const key = ymd(d);
              const info = byDay.get(key);
              const isSel = key === selected;
              return (
                <button
                  key={key}
                  role="gridcell"
                  aria-selected={isSel}
                  aria-label={`${format(d, "EEEE d MMMM")}${info ? `, ${info.tasks} ${t("calendar.legend.task")}, ${info.reminders} ${t("calendar.legend.reminder")}` : ""}`}
                  onClick={() => setSelected(key)}
                  className={cx(
                    "flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-control text-sm transition-colors",
                    !isSameMonth(d, month) && "text-muted/50",
                    isSel ? "bg-primary font-bold text-white" : "hover:bg-canvas",
                    key === today && !isSel && "font-bold text-primary ring-1 ring-primary/30",
                  )}
                >
                  {format(d, "d")}
                  <span className="flex h-1.5 gap-0.5">
                    {info?.tasks ? <span className={cx("size-1.5 rounded-full", isSel ? "bg-white" : "bg-primary")} /> : null}
                    {info?.reminders ? <span className={cx("size-1.5 rounded-full", isSel ? "bg-coral" : "bg-coral-ink")} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex gap-5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> {t("calendar.legend.task")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-coral-ink" /> {t("calendar.legend.reminder")}
            </span>
          </div>
        </Card>

        <section className="lg:col-span-5" aria-labelledby="agenda">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="agenda" className="text-xl font-bold">
              {friendlyDay(selected)}
            </h2>
            <Button variant="ghost" className="px-3" onClick={() => openTaskEditor({ dueDate: selected })}>
              <Plus className="size-4" aria-hidden /> {t("task.action.create")}
            </Button>
          </div>
          {dayTasks.length === 0 && dayReminders.length === 0 ? (
            <EmptyState icon={<CalendarDays className="size-5" />} title={t("calendar.empty_day")} />
          ) : (
            <div className="space-y-6">
              {dayTasks.length > 0 && (
                <div className="space-y-3">
                  {dayTasks.map((x) => (
                    <TaskRow key={x.id} task={x} ideaTitle={ideaTitle(x.idea_id)} />
                  ))}
                </div>
              )}
              {dayReminders.length > 0 && (
                <div className="space-y-4">
                  <h3 className="inline-flex items-center gap-2 text-sm font-bold text-muted">
                    <AlarmClock className="size-4" aria-hidden /> {t("nav.reminders")}
                  </h3>
                  {dayReminders.map(({ r, task }) => (
                    <ReminderItem key={r.id} reminder={r} task={task!} ideaTitle={ideaTitle(task!.idea_id)} compact />
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="sr-only">{timeLabel(new Date())}</p>
        </section>
      </div>
    </>
  );
}
