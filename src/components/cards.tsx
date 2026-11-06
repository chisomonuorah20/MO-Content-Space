"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlarmClock, Check, ChevronRight, CloudUpload, ImageIcon, Link2, Mic, StickyNote, TriangleAlert } from "lucide-react";
import { t } from "@/lib/copy";
import { friendlyDay, relative, timeLabel, todayYmd, dueInstant, ymd } from "@/lib/dates";
import { ideaLabel, useNow } from "@/lib/hooks";
import { attachmentUrl } from "@/lib/sync";
import { effectiveRemindAt, setTaskCompleted, snoozeReminder } from "@/lib/repo";
import type { Attachment, Category, Idea, Reminder, Task } from "@/lib/types";
import { useApp } from "./app-provider";
import { Button, cx, DemoBadge, StatusChip, Tag } from "./ui";

export function useAttachmentUrl(att: Attachment | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!att) return;
    let revoke: string | null = null;
    let alive = true;
    void attachmentUrl(att).then((u) => {
      if (!alive) return;
      setUrl(u);
      if (u?.startsWith("blob:")) revoke = u;
    });
    return () => {
      alive = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [att]);
  return url;
}

export function Thumb({ atts, className }: { atts: Attachment[]; className?: string }) {
  const img = atts.find((a) => a.kind === "image");
  const url = useAttachmentUrl(img);
  const first = atts[0];
  const base = cx("flex shrink-0 items-center justify-center overflow-hidden rounded-tile", className ?? "size-24");
  if (img && url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={cx(base, "object-cover")} />;
  }
  const Icon = img ? ImageIcon : first?.kind === "audio" ? Mic : first?.kind === "url" ? Link2 : StickyNote;
  return (
    <div className={cx(base, "bg-sage/50 text-primary")}>
      <Icon className="size-7" aria-hidden />
    </div>
  );
}

function kindTag(atts: Attachment[], category?: Category) {
  if (category) return <Tag>{category.name}</Tag>;
  const k = atts[0]?.kind;
  if (k === "audio") return <Tag tone="neutral">{t("idea.voice_note")}</Tag>;
  if (k === "image") return <Tag tone="coral">{t("idea.photo")}</Tag>;
  if (k === "url") return <Tag tone="neutral">{t("idea.link")}</Tag>;
  return null;
}

/** Idea card — descriptions wrap to 3 lines max with the full text in the detail view (UI-04). */
export function IdeaCard({
  idea,
  atts,
  transcript,
  category,
  showStatus,
}: {
  idea: Idea;
  atts: Attachment[];
  transcript?: string;
  category?: Category;
  showStatus?: boolean;
}) {
  const label = ideaLabel(idea, atts);
  const preview = idea.title ? idea.body : null;
  const audio = atts.find((a) => a.kind === "audio");
  const link = atts.find((a) => a.kind === "url");
  const pendingUpload = atts.some((a) => a.upload_state === "error");
  return (
    <Link
      href={`/ideas/${idea.id}`}
      className="group flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-all hover:border-primary/25 hover:shadow-raised sm:gap-5 sm:p-5"
    >
      <Thumb atts={atts} className="size-20 sm:size-24" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {kindTag(atts, category)}
            {showStatus && <StatusChip status={idea.status} />}
            {idea.demo && <DemoBadge />}
          </div>
          <span className="text-xs font-medium text-muted">{relative(idea.updated_at)}</span>
        </div>
        <h3 className="font-display text-base font-bold leading-snug break-words text-ink group-hover:text-primary">{label}</h3>
        {(preview || transcript || (link && idea.title)) && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed break-words text-muted">
            {preview ?? (transcript ? `${t("voice.transcript")}: “${transcript}”` : link?.external_url)}
          </p>
        )}
        {audio && !transcript && <p className="mt-1.5 text-xs text-muted">{t("capture.record.hint")}</p>}
        {pendingUpload && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-warning">
            <TriangleAlert className="size-3.5" aria-hidden /> {t("error.sync.title")}
          </p>
        )}
      </div>
    </Link>
  );
}

export function TaskCheckbox({ task }: { task: Task }) {
  return (
    <button
      role="checkbox"
      aria-checked={task.is_completed}
      aria-label={task.is_completed ? t("task.action.incomplete") : t("task.action.complete")}
      title={task.is_completed ? t("task.action.incomplete") : t("task.action.complete")}
      onClick={(e) => {
        e.stopPropagation();
        void setTaskCompleted(task.id, !task.is_completed);
      }}
      className="flex size-11 shrink-0 items-center justify-center -m-2"
    >
      <span
        className={cx(
          "flex size-7 items-center justify-center rounded-lg border-2 transition-colors",
          task.is_completed ? "border-primary bg-primary text-white" : "border-sage bg-canvas hover:border-primary",
        )}
      >
        {task.is_completed && <Check className="size-4" strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}

export function TaskRow({
  task,
  ideaTitle,
  reminder,
  variant = "card",
  showDate,
}: {
  task: Task;
  ideaTitle?: string;
  reminder?: Reminder;
  variant?: "card" | "inset" | "responsive";
  showDate?: boolean;
}) {
  const { openTaskEditor } = useApp();
  const now = useNow();
  const due = dueInstant(task.due_date, task.due_time);
  const overdue = !task.is_completed && ((due && due.getTime() < now.getTime()) || (task.due_date && !task.due_time && task.due_date < todayYmd()));
  const meta: string[] = [];
  if (showDate && task.due_date) meta.push(friendlyDay(task.due_date));
  if (task.due_time) meta.push(task.due_time);
  return (
    <div
      className={cx(
        "group flex items-center gap-4 border transition-all sm:gap-5",
        variant === "card" && "rounded-card border-line bg-surface p-4 shadow-card sm:p-5",
        variant === "inset" && "rounded-tile border-transparent bg-canvas/60 p-4 hover:border-sage hover:bg-canvas",
        variant === "responsive" &&
          "rounded-card border-line bg-surface p-4 shadow-card sm:p-5 lg:rounded-tile lg:border-transparent lg:bg-canvas/60 lg:p-4 lg:shadow-none lg:hover:border-sage lg:hover:bg-canvas",
      )}
    >
      <TaskCheckbox task={task} />
      <button onClick={() => openTaskEditor({ task })} className="min-w-0 flex-1 text-left">
        <p className={cx("font-semibold leading-snug break-words", task.is_completed && "text-muted line-through")}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted">
          {ideaTitle && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Link2 className="size-3" aria-hidden /> {ideaTitle}
            </span>
          )}
          {meta.length > 0 && <span>{meta.join(" · ")}</span>}
          {reminder && (
            <span className="inline-flex items-center gap-1">
              <AlarmClock className="size-3" aria-hidden /> {timeLabel(new Date(effectiveRemindAt(reminder)))}
            </span>
          )}
          {overdue && <span className="font-semibold text-danger">{t("task.overdue")}</span>}
          {task.demo && <DemoBadge />}
        </div>
      </button>
      <ChevronRight className="hidden size-5 shrink-0 text-sage transition-colors group-hover:text-primary sm:block" aria-hidden />
    </div>
  );
}

/** Reminder card with in-app Snooze / Mark Complete (REM-02 in-app equivalents). */
export function ReminderItem({ reminder, task, ideaTitle, compact }: { reminder: Reminder; task: Task; ideaTitle?: string; compact?: boolean }) {
  const at = new Date(effectiveRemindAt(reminder));
  const fired = reminder.state === "fired";
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 shrink-0 pt-1 text-center">
        <div className={cx("text-xs font-bold tabular-nums", fired ? "text-coral-ink" : "text-primary")}>{timeLabel(at)}</div>
        <div className="mt-0.5 text-[11px] text-muted">{friendlyDay(ymd(at))}</div>
      </div>
      <div className={cx("min-w-0 flex-1 rounded-tile border p-4", fired ? "border-coral/60 bg-coral/15" : "border-sage/60 bg-sage/20")}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-sans text-sm font-bold break-words">{task.title}</h3>
          {fired && <Tag tone="coral">{t("reminder.due_now")}</Tag>}
          {task.demo && <DemoBadge />}
        </div>
        {ideaTitle && <p className="mt-1 text-xs text-muted">{ideaTitle}</p>}
        {reminder.snoozed_until && <p className="mt-1 text-xs text-muted">{t("reminder.snoozed", { when: timeLabel(at) })}</p>}
        {(!compact || fired) && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => void snoozeReminder(reminder.id, 10)}>
              {t("reminder.action.snooze")} · {t("reminder.snooze.10")}
            </Button>
            <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={() => void snoozeReminder(reminder.id, 60)}>
              {t("reminder.action.snooze")} · {t("reminder.snooze.60")}
            </Button>
            <Button className="min-h-9 px-3 text-xs" onClick={() => void setTaskCompleted(task.id, true)}>
              <Check className="size-3.5" aria-hidden /> {t("reminder.action.complete")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function UploadBadge({ att }: { att: Attachment }) {
  if (att.kind === "url" || att.upload_state === "uploaded") return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <CloudUpload className="size-3.5" aria-hidden /> {att.upload_state === "error" ? t("error.sync.title") : t("state.saved_local")}
    </span>
  );
}
