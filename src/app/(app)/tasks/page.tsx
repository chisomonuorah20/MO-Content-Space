"use client";

import { useMemo, useState } from "react";
import { AlarmClock, CalendarX, Check, CloudSun, Link2, Plus, Search, TriangleAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { t, type CopyKey } from "@/lib/copy";
import { friendlyDay, relative, timeLabel, todayYmd } from "@/lib/dates";
import { ideaLabel, useIdeas, useReminders, useTasks } from "@/lib/hooks";
import { effectiveRemindAt, setTaskCompleted } from "@/lib/repo";
import type { Reminder, Task } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { Avatar, NotificationsButton } from "@/components/shell";
import { cx, DemoBadge } from "@/components/ui";

type Tab = "today" | "upcoming" | "all" | "completed";
type Tone = "normal" | "overdue" | "muted";
interface Group {
  key: string;
  label: string;
  tone: Tone;
  items: Task[];
}

const byDue = (a: Task, b: Task) => `${a.due_date ?? "9"}${a.due_time ?? "99"}`.localeCompare(`${b.due_date ?? "9"}${b.due_time ?? "99"}`);
const time12 = (hhmm: string) => format(parseISO(`2000-01-01T${hhmm}`), "h:mm a");

/** Tasks_Overview */
export default function TasksPage() {
  const tasks = useTasks();
  const ideas = useIdeas();
  const reminders = useReminders();
  const { openTaskEditor } = useApp();
  const [tab, setTab] = useState<Tab>("today");
  const [q, setQ] = useState("");
  const today = todayYmd();

  // Documented filters (TASK-01): Today shows due today, overdue and unscheduled open tasks.
  const groups = useMemo<Group[]>(() => {
    const n = q.trim().toLowerCase();
    const all = (tasks ?? []).filter((x) => !n || `${x.title} ${x.notes ?? ""}`.toLowerCase().includes(n));
    const open = all.filter((x) => !x.is_completed);
    const dueToday = open.filter((x) => x.due_date === today).sort(byDue);
    const overdue = open.filter((x) => x.due_date && x.due_date < today).sort(byDue);
    const unscheduled = open.filter((x) => !x.due_date);
    const future = open.filter((x) => x.due_date && x.due_date > today).sort(byDue);
    const g = (key: CopyKey, items: Task[], tone: Tone = "normal"): Group => ({ key, label: t(key), tone, items });
    switch (tab) {
      case "today":
        return [g("tasks.group.today", dueToday), g("tasks.group.overdue", overdue, "overdue"), g("tasks.group.unscheduled", unscheduled, "muted")];
      case "upcoming": {
        const m = new Map<string, Task[]>();
        for (const x of future) m.set(x.due_date!, [...(m.get(x.due_date!) ?? []), x]);
        return [...m.entries()].map(([d, items]) => ({ key: d, label: friendlyDay(d), tone: "normal" as Tone, items }));
      }
      case "all":
        return [g("tasks.group.overdue", overdue, "overdue"), g("tasks.group.today", dueToday), g("tasks.tab.upcoming", future), g("tasks.group.unscheduled", unscheduled, "muted")];
      case "completed":
        return [g("tasks.tab.completed", all.filter((x) => x.is_completed).sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")), "muted")];
    }
  }, [tasks, tab, q, today]);

  const visible = groups.filter((g) => g.items.length);
  const ideaTitle = (id: string | null) => {
    const i = id ? ideas?.find((x) => x.id === id) : undefined;
    return i ? ideaLabel(i) : null;
  };
  const tabs: { value: Tab; key: CopyKey }[] = [
    { value: "today", key: "tasks.tab.today" },
    { value: "upcoming", key: "tasks.tab.upcoming" },
    { value: "all", key: "tasks.tab.all" },
    { value: "completed", key: "tasks.tab.completed" },
  ];
  const add = () => openTaskEditor({ dueDate: tab === "today" ? today : undefined });

  const tabBar = (size: "sm" | "lg") => (
    <div role="tablist" aria-label={t("tasks.heading")} className={cx("no-scrollbar flex gap-2 overflow-x-auto", size === "lg" && "-mx-6 px-6 pb-1")}>
      {tabs.map(({ value, key }) => (
        <button
          key={value}
          role="tab"
          aria-selected={tab === value}
          onClick={() => setTab(value)}
          className={cx(
            "shrink-0 font-black tracking-widest uppercase transition-colors",
            size === "lg" ? "min-h-11 rounded-xl px-6 text-[11px]" : "min-h-9 rounded-xl px-4 text-[9px]",
            tab === value ? "bg-primary text-white shadow-md shadow-primary/10" : size === "lg" ? "border border-line bg-canvas text-muted" : "text-muted hover:text-ink",
          )}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
  const search = (cls: string) => (
    <div className={cx("relative", cls)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        aria-label={t("tasks.search")}
        placeholder={t("tasks.search")}
        className="w-full rounded-2xl bg-canvas py-3.5 pr-4 pl-11 text-sm font-medium placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/15 lg:rounded-xl lg:py-2 lg:text-xs"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>
  );

  return (
    <div className="lg:min-h-dvh">
      {/* Mobile header */}
      <header className="sticky top-0 z-30 -mx-5 -mt-6 flex flex-col gap-6 bg-surface px-6 pt-12 pb-6 shadow-sm shadow-ink/5 sm:-mx-8 lg:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight uppercase">{t("tasks.heading")}</h1>
          <div className="flex items-center gap-3">
            <NotificationsButton />
            <Avatar />
          </div>
        </div>
        {search("")}
        {tabBar("lg")}
      </header>

      {/* Desktop header */}
      <header className="sticky top-0 z-30 hidden items-center gap-6 border-b border-line bg-surface px-10 py-5 lg:flex">
        <h1 className="border-r border-line pr-6 text-xl font-black tracking-tight uppercase">{t("tasks.heading")}</h1>
        {tabBar("sm")}
        {search("ml-auto w-56")}
        <button onClick={add} className="flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-6 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-primary/15 hover:bg-primary-hover">
          <Plus className="size-3.5" aria-hidden /> {t("tasks.add")}
        </button>
      </header>

      <div className="mx-auto max-w-3xl pt-8 lg:px-10 lg:py-10">
        {tasks && visible.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <span className="mb-6 flex size-20 items-center justify-center rounded-4xl bg-sage/40 text-primary">
              <CloudSun className="size-8" aria-hidden />
            </span>
            <h2 className="mb-3 text-2xl font-black tracking-tight">{t("tasks.empty.title")}</h2>
            <p className="mb-8 max-w-sm text-sm leading-relaxed font-medium text-muted">{t("tasks.empty.body")}</p>
            <button onClick={add} className="min-h-14 rounded-2xl bg-primary px-8 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-primary/20">
              {t("tasks.empty.cta")}
            </button>
          </div>
        ) : (
          <div className="space-y-12 lg:space-y-10">
            {visible.map((g) => (
              <section key={g.key} aria-labelledby={`g-${g.key}`}>
                <div className="mb-4 flex items-center justify-between px-2">
                  <h2 id={`g-${g.key}`} className={cx("text-[11px] font-black tracking-[0.2em] uppercase lg:text-[9px]", g.tone === "overdue" ? "text-coral-ink" : "text-muted")}>
                    {g.label}
                  </h2>
                  {g.key === "tasks.group.today" && (
                    <span className="rounded-lg bg-sage px-3 py-1 text-[10px] font-black tracking-widest text-primary uppercase lg:text-[8px]">
                      {g.items.length === 1 ? t("tasks.count.one") : t("tasks.count", { count: g.items.length })}
                    </span>
                  )}
                </div>
                <ul className="space-y-4 lg:space-y-3">
                  {g.items.map((task) => (
                    <li key={task.id}>
                      <TaskCard task={task} tone={g.tone} ideaTitle={ideaTitle(task.idea_id)} reminder={reminders?.find((r) => r.task_id === task.id)} onOpen={() => openTaskEditor({ task })} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Mobile floating add */}
      <button
        onClick={add}
        className="fixed right-6 bottom-28 z-30 flex min-h-14 items-center gap-3 rounded-full bg-primary px-7 text-sm font-black tracking-widest text-white uppercase shadow-xl shadow-primary/30 active:scale-95 lg:hidden"
      >
        <Plus className="size-4" aria-hidden /> {t("tasks.add")}
      </button>
    </div>
  );
}

function TaskCard({ task, tone, ideaTitle, reminder, onOpen }: { task: Task; tone: Tone; ideaTitle: string | null; reminder?: Reminder; onOpen: () => void }) {
  const meta: React.ReactNode[] = [];
  if (task.is_completed && task.completed_at) meta.push(<span key="c">{t("tasks.completed_at", { when: relative(task.completed_at) })}</span>);
  else if (tone === "overdue") meta.push(<span key="d">{friendlyDay(task.due_date!)}</span>);
  else if (!task.due_date) meta.push(<span key="d">{t("tasks.no_date")}</span>);
  else if (task.due_time) meta.push(<span key="d">{t("tasks.due_at", { time: time12(task.due_time) })}</span>);
  else meta.push(<span key="d">{friendlyDay(task.due_date)}</span>);

  return (
    <div
      className={cx(
        "group flex items-center gap-5 rounded-4xl border p-6 shadow-sm transition-all lg:rounded-2xl lg:px-5 lg:py-4",
        tone === "muted" && !task.is_completed ? "border-line/60 bg-surface/50" : "border-line/40 bg-surface hover:shadow-raised",
      )}
    >
      <button
        role="checkbox"
        aria-checked={task.is_completed}
        aria-label={task.is_completed ? t("task.action.incomplete") : t("task.action.complete")}
        onClick={() => void setTaskCompleted(task.id, !task.is_completed)}
        className="-m-2 flex size-11 shrink-0 items-center justify-center"
      >
        <span
          className={cx(
            "flex size-7 items-center justify-center rounded-full border-2 transition-colors lg:size-6",
            task.is_completed ? "border-primary bg-primary text-white" : tone === "overdue" ? "border-coral hover:border-coral-ink" : "border-line hover:border-primary",
          )}
        >
          {task.is_completed && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
        </span>
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className={cx("text-lg leading-snug font-bold break-words lg:text-sm", task.is_completed && "text-muted line-through", tone === "muted" && !task.is_completed && "text-ink/70")}>{task.title}</p>
        <p
          className={cx(
            "mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black tracking-widest uppercase lg:text-[8px]",
            tone === "overdue" ? "text-coral-ink" : "text-muted",
          )}
        >
          {tone !== "overdue" && (
            <span className={cx("inline-flex items-center gap-1", ideaTitle ? "text-primary" : "")}>
              {ideaTitle && <Link2 className="size-3" aria-hidden />}
              {ideaTitle ?? t("tasks.no_idea")}
            </span>
          )}
          {tone !== "overdue" && <span aria-hidden>•</span>}
          {meta}
          {reminder && (
            <>
              <span aria-hidden>•</span>
              <span className="inline-flex items-center gap-1">
                <AlarmClock className="size-3" aria-hidden /> {timeLabel(new Date(effectiveRemindAt(reminder)))}
              </span>
            </>
          )}
          {task.demo && <DemoBadge />}
        </p>
      </button>
      {tone === "overdue" && <TriangleAlert className="size-4 shrink-0 text-coral-ink" aria-label={t("task.overdue")} />}
      {tone === "muted" && !task.is_completed && <CalendarX className="size-4 shrink-0 text-muted/40" aria-hidden />}
    </div>
  );
}
