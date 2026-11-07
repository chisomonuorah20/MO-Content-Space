"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { CloudUpload, Info, ListChecks, Search, X } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { ideaLabel, useIdeas } from "@/lib/hooks";
import { createTask, deleteTask, updateTask, ValidationError, type ReminderSpec } from "@/lib/repo";
import { toLocalInput } from "@/lib/dates";
import { notificationPermission } from "@/lib/reminders";
import { PLATFORMS, type Reminder, type Task } from "@/lib/types";
import { Button, Chip, ConfirmDialog, cx, IconButton, Toggle } from "./ui";

type Preset = "at_due" | "before_15" | "before_60" | "custom";
const DRAFT = "mo.task.draft";

interface Props {
  open: boolean;
  task?: Task;
  ideaId?: string | null;
  planId?: string | null;
  dueDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Task_Composer — bottom sheet on mobile, two-column modal on desktop. */
export function TaskComposer(props: Props) {
  const { task } = props;
  const existing = useLiveQuery(
    async () => (task ? ((await getDb().reminders.where("task_id").equals(task.id).toArray()).find((r) => r.state === "scheduled" || r.state === "fired") ?? null) : null),
    [task?.id],
  );
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (props.open && !d.open) d.showModal();
    if (!props.open && d.open) d.close();
  }, [props.open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="composer-title"
      onCancel={(e) => {
        e.preventDefault();
        props.onClose();
      }}
      onClick={(e) => e.target === ref.current && props.onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/30 md:m-auto md:w-[38rem] lg:w-[46rem]"
    >
      {props.open && existing !== undefined && <Form {...props} existing={existing} />}
    </dialog>
  );
}

function initialPreset(r: Reminder | null): { on: boolean; preset: Preset; customAt: string } {
  if (!r) return { on: false, preset: "at_due", customAt: "" };
  if (r.mode === "at_due") return { on: true, preset: "at_due", customAt: "" };
  if (r.mode === "before") return { on: true, preset: r.offset_minutes === 60 ? "before_60" : "before_15", customAt: "" };
  return { on: true, preset: "custom", customAt: toLocalInput(new Date(r.remind_at)) };
}

function readDraft(): Partial<{ title: string; notes: string }> {
  try {
    return JSON.parse(localStorage.getItem(DRAFT) ?? "{}");
  } catch {
    return {};
  }
}

function Form({ task, ideaId, planId, dueDate, onClose, onSaved, existing }: Props & { existing: Reminder | null }) {
  const ideas = useIdeas();
  const [draft] = useState(() => (task ? {} : readDraft()));
  const [init] = useState(() => initialPreset(existing));
  const [title, setTitle] = useState(task?.title ?? draft.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? draft.notes ?? "");
  const [idea, setIdea] = useState<string | null>(task?.idea_id ?? ideaId ?? null);
  const [plan, setPlan] = useState<string | null>(task?.platform_plan_id ?? planId ?? null);
  const [date, setDate] = useState(task?.due_date ?? dueDate ?? "");
  const [time, setTime] = useState(task?.due_time ?? "");
  const [remOn, setRemOn] = useState(init.on);
  const [preset, setPreset] = useState<Preset>(init.preset);
  const [customAt, setCustomAt] = useState(init.customAt);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [perm] = useState(() => notificationPermission());

  const plans = useLiveQuery(async () => (idea ? (await getDb().platform_plans.where("idea_id").equals(idea).toArray()).filter((p) => !p.deleted_at) : []), [idea]);
  const linked = ideas?.find((i) => i.id === idea);
  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return (ideas ?? []).filter((i) => ideaLabel(i).toLowerCase().includes(n)).slice(0, 5);
  }, [ideas, q]);
  const timed = Boolean(date && time);

  // Provisional draft of a new task survives closing the sheet (design: "Auto-saving locally").
  useEffect(() => {
    if (task) return;
    const id = setTimeout(() => {
      try {
        if (title || notes) localStorage.setItem(DRAFT, JSON.stringify({ title, notes }));
        else localStorage.removeItem(DRAFT);
      } catch {}
    }, 300);
    return () => clearTimeout(id);
  }, [title, notes, task]);

  function spec(): ReminderSpec | null {
    if (!remOn) return null;
    if (preset === "at_due") return { mode: "at_due" };
    if (preset === "before_15") return { mode: "before", offset_minutes: 15 };
    if (preset === "before_60") return { mode: "before", offset_minutes: 60 };
    return { mode: "custom", custom_at: new Date(customAt) };
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const input = { title, notes, idea_id: idea, platform_plan_id: plan, due_date: date || null, due_time: time || null, reminder: spec() };
      if (task) await updateTask(task.id, input);
      else await createTask(input);
      try {
        localStorage.removeItem(DRAFT);
      } catch {}
      onSaved();
    } catch (e) {
      const key = e instanceof ValidationError ? e.message : "error.generic";
      setError(key === "task.reminder.past" ? t("composer.reminder.past") : t(key as CopyKey));
    } finally {
      setSaving(false);
    }
  }

  const label = "eyebrow mb-3 block";
  const field = "w-full rounded-2xl border border-line bg-surface px-5 py-3.5 text-sm font-medium shadow-sm placeholder:text-muted/50 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

  return (
    <div className="flex max-h-[94dvh] flex-col overflow-hidden rounded-t-5xl bg-surface shadow-raised md:rounded-5xl">
      <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden />
      <header className="flex items-center justify-between border-b border-line/70 px-8 py-5 md:py-6">
        <div className="flex items-center gap-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-sage/60 text-primary">
            <ListChecks className="size-4" aria-hidden />
          </span>
          <h2 id="composer-title" className="text-sm font-black tracking-[0.3em] uppercase">
            {task ? t("composer.edit") : t("composer.title")}
          </h2>
        </div>
        <IconButton label={t("action.close")} onClick={onClose} className="bg-canvas">
          <X className="size-5" />
        </IconButton>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[1.25fr_1fr]">
        {/* Left: what */}
        <div className="space-y-8 px-8 py-8">
          <div>
            <label htmlFor="task-name" className={label}>
              {t("composer.name")}
            </label>
            <input
              id="task-name"
              autoFocus
              maxLength={200}
              placeholder={t("composer.name.placeholder")}
              className="w-full bg-transparent text-2xl font-black tracking-tight placeholder:text-muted/25 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="task-notes" className={label}>
              {t("composer.notes")}
            </label>
            <textarea
              id="task-notes"
              rows={4}
              placeholder={t("composer.notes.placeholder")}
              className="w-full resize-y rounded-3xl bg-canvas px-6 py-5 text-sm font-medium placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="task-idea" className={label}>
              {t("composer.idea")}
            </label>
            {linked ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-sage/50 px-5 py-3.5">
                <span className="text-sm font-bold break-words text-primary">{ideaLabel(linked)}</span>
                <button
                  onClick={() => {
                    setIdea(null);
                    setPlan(null);
                  }}
                  aria-label={t("composer.idea.clear")}
                  title={t("composer.idea.clear")}
                  className="rounded-full p-1.5 text-primary hover:bg-surface"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-5 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  id="task-idea"
                  type="search"
                  placeholder={t("composer.idea.search")}
                  className="w-full rounded-2xl bg-canvas py-3.5 pr-4 pl-12 text-sm font-medium placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/10"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {matches.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-2xl border border-line bg-surface p-2 shadow-raised">
                    {matches.map((i) => (
                      <li key={i.id}>
                        <button
                          onClick={() => {
                            setIdea(i.id);
                            setQ("");
                          }}
                          className="min-h-11 w-full rounded-xl px-4 py-2 text-left text-sm font-semibold hover:bg-canvas"
                        >
                          {ideaLabel(i)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {plans && plans.length > 0 && (
            <div>
              <p className={label}>{t("composer.platform")}</p>
              <div className="flex flex-wrap gap-2">
                {plans.map((p) => (
                  <Chip key={p.id} selected={plan === p.id} onClick={() => setPlan(plan === p.id ? null : p.id)} className="min-h-10 rounded-xl px-4 text-[10px]">
                    {PLATFORMS.find((x) => x.id === p.platform)?.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: when */}
        <div className="space-y-7 bg-canvas/60 px-8 py-8">
          <div>
            <label htmlFor="task-date" className={label}>
              {t("composer.due_date")}
            </label>
            <input id="task-date" type="date" aria-describedby="date-hint" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
            <p id="date-hint" className="mt-1.5 ml-1 text-[11px] text-muted">
              {t("composer.due_date.placeholder")}
            </p>
          </div>
          <div>
            <label htmlFor="task-time" className={label}>
              {t("composer.due_time")}
            </label>
            <input id="task-time" type="time" className={field} disabled={!date} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">{t("composer.reminder")}</span>
              <Toggle
                checked={remOn}
                onChange={(on) => {
                  setRemOn(on);
                  if (on && !timed && preset !== "custom") setPreset("custom");
                }}
                label={t("composer.reminder.toggle")}
              />
            </div>
            {remOn && (
              <div className="space-y-3">
                <select aria-label={t("composer.reminder")} className={cx(field, "text-[11px] font-black tracking-widest uppercase")} value={preset} onChange={(e) => setPreset(e.target.value as Preset)}>
                  <option value="at_due" disabled={!timed}>
                    {t("task.reminder.at_due")}
                  </option>
                  <option value="before_15" disabled={!timed}>
                    {t("task.reminder.before_15")}
                  </option>
                  <option value="before_60" disabled={!timed}>
                    {t("task.reminder.before_60")}
                  </option>
                  <option value="custom">{t("composer.reminder.custom")}</option>
                </select>
                {!timed && preset !== "custom" && <p className="ml-1 text-[11px] text-muted">{t("task.reminder.needs_time")}</p>}
                {preset === "custom" && (
                  <input type="datetime-local" aria-label={t("task.reminder.custom")} className={field} min={toLocalInput(new Date())} value={customAt} onChange={(e) => setCustomAt(e.target.value)} />
                )}
                {perm !== "granted" && (
                  <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-3 text-[11px] leading-relaxed font-bold text-muted">
                    <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden /> {t("composer.reminder.perm")}
                  </p>
                )}
              </div>
            )}
          </div>
          {error && (
            <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-xs font-bold text-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      <footer className="pb-safe flex flex-wrap items-center justify-between gap-4 border-t border-line/70 px-8 py-5">
        <p className="flex items-center gap-2 text-[9px] font-bold tracking-[0.15em] text-muted/60 uppercase">
          <CloudUpload className="size-3.5" aria-hidden /> {t("editor.autosave")}
        </p>
        <div className="flex w-full items-center justify-end gap-3 md:w-auto">
          {task && (
            <Button variant="quiet" className="mr-auto text-danger md:mr-0" onClick={() => setConfirmDelete(true)}>
              {t("action.delete")}
            </Button>
          )}
          <Button variant="quiet" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button onClick={save} loading={saving} disabled={!title.trim()} className="flex-1 md:flex-none">
            {t("composer.save")}
          </Button>
        </div>
      </footer>
      {task && (
        <ConfirmDialog
          open={confirmDelete}
          title={t("task.delete.title")}
          body={task.title}
          confirmLabel={t("action.confirm_delete")}
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteTask(task.id);
            setConfirmDelete(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
