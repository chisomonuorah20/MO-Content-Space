"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { t, type CopyKey } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { ideaLabel, useIdeas } from "@/lib/hooks";
import { createTask, deleteTask, updateTask, ValidationError, type ReminderSpec } from "@/lib/repo";
import { toLocalInput } from "@/lib/dates";
import type { Reminder, Task } from "@/lib/types";
import { Button, ConfirmDialog, cx, Field, inputClass, Sheet } from "./ui";

type ReminderChoice = "none" | "at_due" | "before_10" | "before_60" | "custom";

interface Props {
  open: boolean;
  task?: Task;
  ideaId?: string | null;
  dueDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskEditor(props: Props) {
  const { task } = props;
  // null = loaded with no active reminder; undefined = still loading
  const existingReminder = useLiveQuery(
    async () => (task ? ((await getDb().reminders.where("task_id").equals(task.id).toArray()).find((r) => r.state === "scheduled" || r.state === "fired") ?? null) : null),
    [task?.id],
  );
  if (existingReminder === undefined) return null;
  return <TaskForm {...props} existingReminder={existingReminder} />;
}

function initialReminder(r: Reminder | null): { rem: ReminderChoice; customAt: string } {
  if (!r) return { rem: "none", customAt: "" };
  if (r.mode === "at_due") return { rem: "at_due", customAt: "" };
  if (r.mode === "before") return { rem: r.offset_minutes === 60 ? "before_60" : "before_10", customAt: "" };
  return { rem: "custom", customAt: toLocalInput(new Date(r.remind_at)) };
}

function TaskForm({ open, task, ideaId, dueDate, onClose, onSaved, existingReminder }: Props & { existingReminder: Reminder | null }) {
  const ideas = useIdeas();
  const [init] = useState(() => initialReminder(existingReminder));
  const [title, setTitle] = useState(task?.title ?? "");
  const [idea, setIdea] = useState(task?.idea_id ?? ideaId ?? "");
  const [date, setDate] = useState(task?.due_date ?? dueDate ?? "");
  const [time, setTime] = useState(task?.due_time ?? "");
  const [rem, setRem] = useState<ReminderChoice>(init.rem);
  const [customAt, setCustomAt] = useState(init.customAt);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const timed = Boolean(date && time);

  function spec(): ReminderSpec | null {
    switch (rem) {
      case "none":
        return null;
      case "at_due":
        return { mode: "at_due" };
      case "before_10":
        return { mode: "before", offset_minutes: 10 };
      case "before_60":
        return { mode: "before", offset_minutes: 60 };
      case "custom":
        return { mode: "custom", custom_at: new Date(customAt) };
    }
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const input = { title, idea_id: idea || null, due_date: date || null, due_time: time || null, reminder: spec() };
      if (task) await updateTask(task.id, input);
      else await createTask(input);
      onSaved();
    } catch (e) {
      setError(e instanceof ValidationError ? t(e.message as CopyKey) : t("error.generic"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={task ? t("task.edit.title") : t("task.action.create")}
        footer={
          <div className="flex items-center justify-between gap-3">
            <div>
              {task && (
                <Button variant="ghost" className="text-danger hover:bg-danger-tint" onClick={() => setConfirmDelete(true)}>
                  {t("action.delete")}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                {t("action.cancel")}
              </Button>
              <Button onClick={save} loading={saving} disabled={!title.trim()}>
                {task ? t("action.save") : t("task.action.create")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 pt-1">
          <Field label={t("task.field.title")}>
            {(id) => (
              <input id={id} autoFocus className={inputClass} placeholder={t("task.field.title.placeholder")} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
            )}
          </Field>
          <Field label={t("task.field.idea")}>
            {(id) => (
              <select id={id} className={inputClass} value={idea} onChange={(e) => setIdea(e.target.value)}>
                <option value="">{t("task.field.no_idea")}</option>
                {ideas?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {ideaLabel(i)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("task.field.due_date")}>
              {(id) => <input id={id} type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />}
            </Field>
            <Field label={t("task.field.due_time")}>
              {(id) => <input id={id} type="time" className={inputClass} value={time} disabled={!date} onChange={(e) => setTime(e.target.value)} />}
            </Field>
          </div>
          <Field label={t("task.field.reminder")} hint={!timed && rem !== "custom" ? t("task.reminder.needs_time") : undefined}>
            {(id) => (
              <select id={id} className={inputClass} value={rem} onChange={(e) => setRem(e.target.value as ReminderChoice)}>
                <option value="none">{t("task.reminder.none")}</option>
                <option value="at_due" disabled={!timed}>
                  {t("task.reminder.at_due")}
                </option>
                <option value="before_10" disabled={!timed}>
                  {t("task.reminder.before_10")}
                </option>
                <option value="before_60" disabled={!timed}>
                  {t("task.reminder.before_60")}
                </option>
                <option value="custom">{t("task.reminder.custom")}</option>
              </select>
            )}
          </Field>
          {rem === "custom" && (
            <Field label={t("task.reminder.custom")}>
              {(id) => <input id={id} type="datetime-local" className={cx(inputClass)} value={customAt} min={toLocalInput(new Date())} onChange={(e) => setCustomAt(e.target.value)} />}
            </Field>
          )}
          {error && (
            <p role="alert" className="rounded-control bg-danger-tint px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </Sheet>
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
    </>
  );
}
