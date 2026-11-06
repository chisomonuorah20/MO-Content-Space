"use client";

import { useMemo, useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { friendlyDay, relative, todayYmd } from "@/lib/dates";
import { ideaLabel, useIdeas, useReminders, useTasks } from "@/lib/hooks";
import type { Task } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { TaskRow } from "@/components/cards";
import { TopBar } from "@/components/shell";
import { Button, EmptyState, Segmented } from "@/components/ui";

type Tab = "today" | "upcoming" | "all" | "completed";
const EMPTY: Record<Tab, CopyKey> = {
  today: "empty.tasks.title",
  upcoming: "tasks.empty.upcoming",
  all: "tasks.empty.all",
  completed: "tasks.empty.completed",
};

const sortKey = (x: Task) => `${x.due_date ?? "9999-99-99"}${x.due_time ?? "99:99"}${x.created_at}`;

export default function TasksPage() {
  const tasks = useTasks();
  const ideas = useIdeas();
  const reminders = useReminders();
  const { openTaskEditor } = useApp();
  const [tab, setTab] = useState<Tab>("today");
  const today = todayYmd();

  // Documented filters (TASK-01): Today = open & due today or overdue; Upcoming = open & due after today;
  // All = every open task (incl. undated); Completed = done, newest first.
  const list = useMemo(() => {
    const all = tasks ?? [];
    switch (tab) {
      case "today":
        return all.filter((x) => !x.is_completed && x.due_date && x.due_date <= today).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      case "upcoming":
        return all.filter((x) => !x.is_completed && x.due_date && x.due_date > today).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      case "all":
        return all.filter((x) => !x.is_completed).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
      case "completed":
        return all.filter((x) => x.is_completed).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
    }
  }, [tasks, tab, today]);

  const ideaTitle = (id: string | null) => {
    const i = id ? ideas?.find((x) => x.id === id) : undefined;
    return i ? ideaLabel(i) : undefined;
  };

  // Group upcoming by day for scanability.
  const groups = useMemo(() => {
    if (tab !== "upcoming") return [{ label: null as string | null, items: list }];
    const m = new Map<string, Task[]>();
    for (const x of list) m.set(x.due_date!, [...(m.get(x.due_date!) ?? []), x]);
    return [...m.entries()].map(([d, items]) => ({ label: friendlyDay(d), items }));
  }, [list, tab]);

  return (
    <>
      <TopBar
        title={t("tasks.title")}
        actions={
          <Button onClick={() => openTaskEditor({ dueDate: tab === "today" ? today : undefined })}>
            <Plus className="size-4" aria-hidden /> {t("task.action.create")}
          </Button>
        }
      />
      <div className="mb-6">
        <Segmented<Tab>
          label={t("tasks.title")}
          value={tab}
          onChange={setTab}
          options={[
            { value: "today", label: t("tasks.tab.today") },
            { value: "upcoming", label: t("tasks.tab.upcoming") },
            { value: "all", label: t("tasks.tab.all") },
            { value: "completed", label: t("tasks.tab.completed") },
          ]}
        />
      </div>
      {tasks && list.length === 0 ? (
        <EmptyState icon={<ListChecks className="size-5" />} title={t(EMPTY[tab])} />
      ) : (
        <div className="max-w-3xl space-y-8">
          {groups.map((g) => (
            <section key={g.label ?? "all"}>
              {g.label && <h2 className="mb-3 text-sm font-bold text-muted">{g.label}</h2>}
              <div className="space-y-3">
                {g.items.map((task) => (
                  <div key={task.id}>
                    <TaskRow task={task} showDate ideaTitle={ideaTitle(task.idea_id)} reminder={reminders?.find((r) => r.task_id === task.id)} />
                    {task.is_completed && task.completed_at && (
                      <p className="mt-1 ml-5 text-xs text-muted">{t("tasks.completed_at", { when: relative(task.completed_at) })}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
