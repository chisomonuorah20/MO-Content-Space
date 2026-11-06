"use client";

import { useState } from "react";
import { BellOff, BellRing } from "lucide-react";
import { t } from "@/lib/copy";
import { ideaLabel, useIdeas, useReminders, useTasks } from "@/lib/hooks";
import { effectiveRemindAt } from "@/lib/repo";
import { notificationPermission, requestNotificationPermission } from "@/lib/reminders";
import { ReminderItem } from "@/components/cards";
import { TopBar } from "@/components/shell";
import { Button, EmptyState } from "@/components/ui";

export default function RemindersPage() {
  const reminders = useReminders();
  const tasks = useTasks();
  const ideas = useIdeas();
  const [perm, setPerm] = useState<ReturnType<typeof notificationPermission>>(() => (typeof window === "undefined" ? "default" : notificationPermission()));

  const rows = (reminders ?? [])
    .map((r) => ({ r, task: tasks?.find((x) => x.id === r.task_id) }))
    .filter((x) => x.task && !x.task.deleted_at && !x.task.is_completed)
    .sort((a, b) => effectiveRemindAt(a.r).localeCompare(effectiveRemindAt(b.r)));
  const due = rows.filter((x) => x.r.state === "fired");
  const upcoming = rows.filter((x) => x.r.state === "scheduled");
  const ideaTitle = (id: string | null) => {
    const i = id ? ideas?.find((x) => x.id === id) : undefined;
    return i ? ideaLabel(i) : undefined;
  };

  return (
    <>
      <TopBar title={t("reminders.title")} />
      {perm !== "granted" && (
        <div role="status" className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-5">
          <p className="flex items-center gap-3 text-sm text-muted">
            <BellOff className="size-5 shrink-0 text-primary" aria-hidden />
            {perm === "denied" ? t("reminders.permission.denied") : t("reminders.permission.off")}
          </p>
          {perm === "default" && (
            <Button variant="secondary" onClick={async () => setPerm(await requestNotificationPermission())}>
              {t("reminders.permission.enable")}
            </Button>
          )}
        </div>
      )}
      <div className="grid max-w-3xl gap-10">
        {due.length > 0 && (
          <section aria-labelledby="due">
            <h2 id="due" className="mb-4 text-xl font-bold">
              {t("reminders.due")}
            </h2>
            <div className="space-y-5">
              {due.map(({ r, task }) => (
                <ReminderItem key={r.id} reminder={r} task={task!} ideaTitle={ideaTitle(task!.idea_id)} />
              ))}
            </div>
          </section>
        )}
        <section aria-labelledby="upcoming">
          <h2 id="upcoming" className="mb-4 text-xl font-bold">
            {t("reminders.upcoming")}
          </h2>
          {reminders && upcoming.length === 0 ? (
            <EmptyState icon={<BellRing className="size-5" />} title={t("reminders.empty")} />
          ) : (
            <div className="space-y-5">
              {upcoming.map(({ r, task }) => (
                <ReminderItem key={r.id} reminder={r} task={task!} ideaTitle={ideaTitle(task!.idea_id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
