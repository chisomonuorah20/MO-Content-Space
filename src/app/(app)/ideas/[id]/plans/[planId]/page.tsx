"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Check, ChevronDown, MoreVertical, Plus, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { t } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { ideaLabel, useIdea } from "@/lib/hooks";
import { removePlatformPlan, setTaskCompleted, updatePlatformPlan } from "@/lib/repo";
import type { Idea, PlatformPlan, PublishState, Task } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { useAttachmentUrl } from "@/components/cards";
import { coverOf } from "@/components/library-card";
import { PLAN_STATE_KEY, PlatformIcon, platformLabel } from "@/components/platform-icon";
import { Button, ConfirmDialog, cx } from "@/components/ui";

/** Idea_Platform_Plans — lightweight per-platform plan nested under one idea (PLAT-01, UI-12). */
export default function PlatformPlanPage() {
  const { id, planId } = useParams<{ id: string; planId: string }>();
  const idea = useIdea(id);
  const plan = useLiveQuery(async () => (await getDb().platform_plans.get(planId)) ?? null, [planId]);
  const tasks = useLiveQuery(() => getDb().tasks.where("platform_plan_id").equals(planId).filter((x) => !x.deleted_at).sortBy("created_at"), [planId]);
  if (!idea || !plan || plan.deleted_at || !tasks) return null;
  return <PlanEditor key={plan.id} idea={idea} plan={plan} tasks={tasks} />;
}

function PlanEditor({ idea, plan, tasks }: { idea: Idea; plan: PlatformPlan; tasks: Task[] }) {
  const router = useRouter();
  const { openTaskEditor, toast } = useApp();
  const [state, setState] = useState<PublishState>(plan.publish_state);
  const [date, setDate] = useState(plan.target_at ? format(parseISO(plan.target_at), "yyyy-MM-dd") : "");
  const [caption, setCaption] = useState(plan.caption ?? "");
  const [notes, setNotes] = useState(plan.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const left = tasks.filter((x) => !x.is_completed).length;
  const back = `/ideas/${idea.id}`;
  const title = t("plan.title", { platform: platformLabel(plan.platform) });

  async function save() {
    setSaving(true);
    await updatePlatformPlan(plan.id, {
      publish_state: state,
      caption: caption || null,
      notes: notes || null,
      target_at: date ? new Date(`${date}T12:00:00`).toISOString() : null,
    });
    setSaving(false);
    toast(t("plan.saved"));
  }

  const panelCard = "rounded-4xl border border-line/60 bg-surface p-6 shadow-sm lg:rounded-2xl lg:bg-canvas lg:p-4 lg:shadow-none";
  const area = "w-full resize-y bg-transparent text-[15px] leading-relaxed font-medium placeholder:text-muted/40 focus:outline-none lg:text-sm";

  const form = (
    <div className="space-y-10 lg:space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className={panelCard}>
          <label htmlFor="p-state" className="eyebrow mb-3 block text-[9px]">
            {t("plan.status")}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-0 size-2 -translate-y-1/2 rounded-full bg-primary" aria-hidden />
            <select
              id="p-state"
              value={state}
              onChange={(e) => setState(e.target.value as PublishState)}
              className="w-full appearance-none bg-transparent pr-5 pl-4 text-sm font-bold text-primary focus:outline-none lg:pl-4"
            >
              {(Object.keys(PLAN_STATE_KEY) as PublishState[]).map((s) => (
                <option key={s} value={s}>
                  {t(PLAN_STATE_KEY[s])}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-0 size-3 -translate-y-1/2 text-muted" aria-hidden />
          </div>
        </div>
        <div className={panelCard}>
          <label htmlFor="p-date" className="eyebrow mb-3 block text-[9px]">
            {t("plan.date")}
          </label>
          <input id="p-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent text-sm font-bold focus:outline-none" />
        </div>
      </div>

      <div>
        <label htmlFor="p-caption" className="eyebrow mb-4 ml-1 block text-ink">
          {t("plan.caption")}
        </label>
        <div className={cx(panelCard, "lg:p-5")}>
          <textarea id="p-caption" rows={4} placeholder={t("plan.caption.placeholder")} className={area} value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="p-notes" className="eyebrow mb-4 ml-1 block text-ink">
          {t("plan.notes")}
        </label>
        <div className={cx(panelCard, "lg:p-5")}>
          <textarea id="p-notes" rows={5} placeholder={t("plan.notes.placeholder")} className={cx(area, "text-muted")} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between px-1">
          <h2 className="eyebrow text-ink">{t("plan.tasks")}</h2>
          {tasks.length > 0 && <span className="rounded-lg bg-sage px-2 py-1 text-[9px] font-black tracking-widest text-primary uppercase">{t("plan.tasks.left", { count: left })}</span>}
        </div>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className={cx("flex items-center gap-4 rounded-4xl border border-line/50 px-5 py-4 shadow-sm lg:rounded-2xl lg:bg-canvas lg:shadow-none", task.is_completed ? "bg-surface/60" : "bg-surface")}>
              <button
                role="checkbox"
                aria-checked={task.is_completed}
                aria-label={task.is_completed ? t("task.action.incomplete") : t("task.action.complete")}
                onClick={() => void setTaskCompleted(task.id, !task.is_completed)}
                className="-m-2 flex size-11 shrink-0 items-center justify-center"
              >
                <span className={cx("flex size-7 items-center justify-center rounded-full border-2 lg:size-5", task.is_completed ? "border-primary/60 bg-primary/60 text-white" : "border-line")}>
                  {task.is_completed && <Check className="size-3.5 lg:size-3" strokeWidth={3} aria-hidden />}
                </span>
              </button>
              <button onClick={() => openTaskEditor({ task })} className={cx("flex-1 text-left text-sm font-bold break-words", task.is_completed && "text-muted line-through")}>
                {task.title}
              </button>
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-6 w-full" onClick={() => openTaskEditor({ ideaId: idea.id, planId: plan.id })}>
          <Plus className="size-4" aria-hidden /> {t("plan.add_task")}
        </Button>
      </section>

      <Button variant="secondary" size="lg" className="w-full" onClick={save} loading={saving}>
        {t("plan.save")}
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-30 -mx-5 -mt-6 mb-8 flex items-center justify-between bg-surface px-6 pt-12 pb-6 shadow-sm shadow-ink/5 sm:-mx-8">
          <Link href={back} aria-label={t("detail.back")} title={t("detail.back")} className="flex size-11 items-center justify-center rounded-full bg-canvas text-muted">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-[11px] font-black tracking-[0.3em] uppercase">{title}</h1>
          <button onClick={() => setConfirm(true)} aria-label={t("plan.remove")} title={t("plan.remove")} className="flex size-11 items-center justify-center rounded-full bg-canvas text-muted">
            <MoreVertical className="size-4" />
          </button>
        </header>
        {form}
      </div>

      {/* Desktop: idea underneath, plan drawer on the right */}
      <div className="hidden min-h-dvh lg:flex">
        <IdeaBackdrop idea={idea} href={back} />
        <aside className="w-[500px] shrink-0 border-l border-line bg-surface p-8 shadow-raised" aria-labelledby="plan-title">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-sage/50 text-primary">
                <PlatformIcon platform={plan.platform} />
              </span>
              <h1 id="plan-title" className="text-[11px] font-black tracking-[0.3em] uppercase">
                {title}
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirm(true)} aria-label={t("plan.remove")} title={t("plan.remove")} className="flex size-9 items-center justify-center rounded-xl bg-canvas text-muted hover:text-danger">
                <Trash2 className="size-4" />
              </button>
              <button onClick={() => router.push(back)} aria-label={t("action.close")} title={t("action.close")} className="flex size-9 items-center justify-center rounded-xl bg-canvas text-muted hover:text-ink">
                <X className="size-4" />
              </button>
            </div>
          </div>
          {form}
        </aside>
      </div>

      <ConfirmDialog
        open={confirm}
        title={t("plan.remove")}
        body={title}
        confirmLabel={t("action.delete")}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await removePlatformPlan(plan.id);
          router.replace(back);
        }}
      />
    </>
  );
}

function IdeaBackdrop({ idea, href }: { idea: Idea; href: string }) {
  const atts = useLiveQuery(() => getDb().attachments.where("idea_id").equals(idea.id).filter((a) => !a.deleted_at).toArray(), [idea.id]);
  const url = useAttachmentUrl(coverOf(idea, atts ?? []));
  return (
    <div className="min-w-0 flex-1 p-12">
      <Link href={href} className="mb-8 flex items-center gap-2 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden /> {t("detail.back")}
      </Link>
      <Link href={href} className="block opacity-50 transition-opacity hover:opacity-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url ? <img src={url} alt="" className="mb-10 h-48 w-full rounded-4xl object-cover" /> : <div className="mb-10 h-48 rounded-4xl bg-line/60" />}
        <p className="mb-4 text-3xl font-black tracking-tight">{ideaLabel(idea)}</p>
        {idea.body && <p className="line-clamp-3 text-sm text-muted italic">{idea.body}</p>}
      </Link>
    </div>
  );
}
