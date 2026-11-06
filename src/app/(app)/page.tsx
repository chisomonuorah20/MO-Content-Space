"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BellRing, Lightbulb, ListChecks, Zap } from "lucide-react";
import { t } from "@/lib/copy";
import { greetingKey, todayYmd } from "@/lib/dates";
import { ideaLabel, useAttachments, useCategories, useIdeas, useNow, useProfile, useReminders, useTasks, useTranscripts } from "@/lib/hooks";
import { effectiveRemindAt } from "@/lib/repo";
import { useApp } from "@/components/app-provider";
import { CAPTURE_MODES } from "@/components/quick-capture";
import { IdeaCard, ReminderItem, TaskRow } from "@/components/cards";
import { Avatar, NotificationsButton, SearchButton, SyncStatus } from "@/components/shell";
import { cx, EmptyState } from "@/components/ui";

export default function HomePage() {
  const profile = useProfile();
  const now = useNow();
  const ideas = useIdeas();
  const tasks = useTasks();
  const reminders = useReminders();
  const atts = useAttachments();
  const transcripts = useTranscripts();
  const categories = useCategories();
  const { openCapture } = useApp();

  const ideaById = useMemo(() => new Map((ideas ?? []).map((i) => [i.id, i])), [ideas]);
  const today = todayYmd();
  // Today = due today or overdue and still open (date-based, local display dates).
  const todayTasks = (tasks ?? [])
    .filter((x) => !x.is_completed && x.due_date && x.due_date <= today)
    .sort((a, b) => (a.due_date! + (a.due_time ?? "99")).localeCompare(b.due_date! + (b.due_time ?? "99")));
  const upcoming = (reminders ?? [])
    .map((r) => ({ r, task: tasks?.find((x) => x.id === r.task_id) }))
    .filter((x) => x.task && !x.task.is_completed)
    .sort((a, b) => effectiveRemindAt(a.r).localeCompare(effectiveRemindAt(b.r)))
    .slice(0, 3);
  const recent = (ideas ?? []).slice(0, 3);
  const firstName = profile?.first_name ?? "";
  const remindersFor = (taskId: string) => reminders?.find((r) => r.task_id === taskId);

  return (
    <div className="space-y-10 lg:space-y-0">
      {/* Header — mobile: sticky white bar; desktop: page header */}
      <header className="sticky top-0 z-30 -mx-5 -mt-6 flex items-center justify-between gap-3 bg-surface px-5 pt-8 pb-5 shadow-sm shadow-ink/5 sm:-mx-8 sm:px-8 lg:static lg:m-0 lg:mb-14 lg:bg-transparent lg:p-0 lg:shadow-none">
        <div className="flex min-w-0 items-center gap-4">
          <div className="lg:hidden">
            <Avatar />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl leading-tight font-bold tracking-tight lg:text-3xl">{t(greetingKey(now), { firstName })}</h1>
            <p className="mt-1 text-sm font-medium text-muted lg:mt-1.5 lg:text-base">{t("home.subtitle")}</p>
            <div className="mt-2 lg:hidden">
              <SyncStatus compact />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 lg:gap-5">
          <div className="hidden lg:block">
            <SyncStatus />
          </div>
          <div className="lg:hidden">
            <SearchButton />
          </div>
          <NotificationsButton />
          <div className="hidden lg:block">
            <Avatar />
          </div>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left column */}
        <div className="min-w-0 space-y-10 lg:col-span-7">
          <section aria-labelledby="qc-title" className="relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
            <div className="relative z-10">
              <div className="mb-8 flex flex-col items-center text-center lg:flex-row-reverse lg:items-center lg:justify-between lg:text-left">
                <div className="mb-4 flex size-14 items-center justify-center rounded-tile bg-sage/50 text-primary lg:mb-0 lg:size-12">
                  <Zap className="size-6" aria-hidden />
                </div>
                <div>
                  <h2 id="qc-title" className="text-2xl font-bold tracking-tight lg:text-xl">
                    {t("capture.entry.title")}
                  </h2>
                  <p className="mt-1.5 text-sm font-medium text-muted">{t("capture.entry.subtitle")}</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                {CAPTURE_MODES.map(({ mode, key, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => openCapture(mode)}
                    className="group/btn flex min-h-24 flex-col items-center justify-center gap-2.5 rounded-tile border border-transparent bg-canvas px-1 py-4 transition-all hover:border-sage hover:bg-sage/40 active:scale-95 sm:gap-3 sm:p-4"
                  >
                    <span className="flex size-11 items-center justify-center rounded-control bg-surface text-primary shadow-card transition-transform group-hover/btn:scale-110 sm:size-12">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-center text-xs leading-tight font-bold sm:text-sm">{t(key)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div aria-hidden className="absolute -right-20 -bottom-20 size-64 rounded-full bg-sage/30 opacity-50 blur-3xl" />
          </section>

          <section aria-labelledby="tasks-title" className="lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-8 lg:shadow-card">
            <div className="mb-5 flex items-center justify-between gap-3 lg:mb-8">
              <div className="flex items-center gap-3">
                <h2 id="tasks-title" className="text-xl font-bold tracking-tight">
                  {t("home.tasks.title")}
                </h2>
                {todayTasks.length > 0 && (
                  <span className="rounded-lg bg-sage px-2.5 py-1 text-xs font-bold text-primary">{t("home.tasks.remaining", { count: todayTasks.length })}</span>
                )}
              </div>
              <Link href="/tasks" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                {t("action.view_all")} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            {tasks && todayTasks.length === 0 ? (
              <EmptyState icon={<ListChecks className="size-5" />} title={t("empty.tasks.title")} body={t("empty.tasks.body")} />
            ) : (
              <div className="space-y-4">
                {todayTasks.slice(0, 5).map((task) => {
                  const idea = task.idea_id ? ideaById.get(task.idea_id) : undefined;
                  return <TaskRow key={task.id} task={task} variant="responsive" reminder={remindersFor(task.id)} ideaTitle={idea ? ideaLabel(idea, atts?.get(idea.id)) : undefined} />;
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-10 lg:col-span-5">
          <section aria-labelledby="rem-title" className="lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-8 lg:shadow-card">
            <div className="mb-5 flex items-center justify-between lg:mb-8">
              <h2 id="rem-title" className="text-xl font-bold tracking-tight">
                {t("home.reminders.title")}
              </h2>
              <Link href="/reminders" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                {t("action.view_all")} <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            {reminders && upcoming.length === 0 ? (
              <EmptyState icon={<BellRing className="size-5" />} title={t("home.reminders.empty")} />
            ) : (
              <div className={cx("space-y-5 rounded-card border border-sage/40 bg-sage/10 p-4 lg:border-0 lg:bg-transparent lg:p-0")}>
                {upcoming.map(({ r, task }) => {
                  const idea = task!.idea_id ? ideaById.get(task!.idea_id) : undefined;
                  return <ReminderItem key={r.id} reminder={r} task={task!} compact ideaTitle={idea ? ideaLabel(idea) : undefined} />;
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="ideas-title">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="ideas-title" className="text-xl font-bold tracking-tight">
                {t("home.ideas.title")}
              </h2>
              <Link href="/ideas" className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">
                {t("action.view_library")}
              </Link>
            </div>
            {ideas && recent.length === 0 ? (
              <EmptyState icon={<Lightbulb className="size-5" />} title={t("empty.ideas.title")} body={t("empty.ideas.body")} />
            ) : (
              <div className="space-y-4">
                {recent.map((i) => (
                  <IdeaCard
                    key={i.id}
                    idea={i}
                    atts={atts?.get(i.id) ?? []}
                    transcript={(atts?.get(i.id) ?? []).map((a) => transcripts?.get(a.id)).find(Boolean)}
                    category={categories?.find((c) => c.id === i.category_id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
