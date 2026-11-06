"use client";

import { getDb } from "./db";
import { dueInstant, localTz, nowIso } from "./dates";
import type {
  Attachment,
  Category,
  EntityTable,
  Idea,
  IdeaStatus,
  Platform,
  PlatformPlan,
  Profile,
  PublishState,
  Reminder,
  ReminderMode,
  Task,
  Transcript,
} from "./types";
import { requestSync } from "./sync";

export const uid = () => crypto.randomUUID();

export const LIMITS = {
  imageMb: 20,
  audioMb: 50,
  attachmentsPerIdea: 10,
  taskTitle: 200,
};
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

export class ValidationError extends Error {}

// ---------- profile ----------

export async function getProfile(): Promise<Profile | undefined> {
  return (await getDb().meta.get("me")) as Profile | undefined;
}

export async function setProfile(p: Omit<Profile, "key">) {
  await getDb().meta.put({ key: "me", ...p });
}

async function ownerId(): Promise<string> {
  const p = await getProfile();
  if (!p) throw new Error("Not signed in");
  return p.user_id;
}

/** Remove all local user data (sign-out). */
export async function wipeLocal() {
  const db = getDb();
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
  });
}

// ---------- outbox core ----------

type Row = Idea | Category | Attachment | Transcript | PlatformPlan | Task | Reminder;

function base(user_id: string, demo = false) {
  const ts = nowIso();
  return { id: uid(), user_id, created_at: ts, updated_at: ts, deleted_at: null, version: 0, ...(demo ? { demo } : {}) };
}

/** Write an entity and its outbox entry atomically (PRD §5.1 step 1). */
async function put(table: EntityTable, row: Row) {
  const db = getDb();
  await db.transaction("rw", [db.table(table), db.outbox], async () => {
    await db.table(table).put(row);
    const existing = await db.outbox.where("entity_id").equals(row.id).first();
    if (!existing) {
      await db.outbox.put({
        op_id: uid(),
        entity_type: table,
        entity_id: row.id,
        state: "pending",
        attempt_count: 0,
        last_error: null,
        created_at: nowIso(),
      });
    } else if (existing.state === "error") {
      await db.outbox.update(existing.op_id, { state: "pending" });
    }
  });
  requestSync();
}

async function patch<T extends Row>(table: EntityTable, id: string, changes: Partial<T>) {
  const row = (await getDb().table(table).get(id)) as T | undefined;
  if (!row) throw new Error(`${table} ${id} not found`);
  const next = { ...row, ...changes, updated_at: nowIso() } as T;
  await put(table, next);
  return next;
}

// ---------- ideas ----------

export interface NewAttachmentInput {
  kind: "image" | "audio" | "url";
  blob?: Blob;
  file_name?: string;
  url?: string;
  duration_ms?: number;
  note?: string | null;
}

export function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function validateFile(blob: Blob, kind: "image" | "audio") {
  if (kind === "image" && !IMAGE_TYPES.includes(blob.type)) throw new ValidationError("capture.error.file_type");
  const limit = kind === "image" ? LIMITS.imageMb : LIMITS.audioMb;
  if (blob.size > limit * 1024 * 1024) throw new ValidationError(`capture.error.file_size:${limit}`);
}

/**
 * Create an idea (IDEA-01). `clientId` doubles as the idea id so a double-tapped Save
 * produces only one record.
 */
export async function createIdea(input: {
  clientId: string;
  title?: string | null;
  body?: string | null;
  category_id?: string | null;
  attachments?: NewAttachmentInput[];
  demo?: boolean;
}): Promise<Idea> {
  const db = getDb();
  const dup = await db.ideas.get(input.clientId);
  if (dup) return dup;

  const title = input.title?.trim() || null;
  const body = input.body?.trim() || null;
  const atts = input.attachments ?? [];
  if (!body && !title && atts.length === 0) throw new ValidationError("capture.error.empty");
  if (atts.length > LIMITS.attachmentsPerIdea) throw new ValidationError("capture.error.empty");

  const user_id = await ownerId();
  const idea: Idea = {
    ...base(user_id, input.demo),
    id: input.clientId,
    title,
    body,
    status: "new",
    category_id: input.category_id ?? null,
  };

  const attRows: Attachment[] = [];
  for (const a of atts) {
    if (a.kind !== "url" && a.blob) validateFile(a.blob, a.kind);
    let url: string | null = null;
    if (a.kind === "url") {
      url = normalizeUrl(a.url ?? "");
      if (!url) throw new ValidationError("capture.error.link");
    }
    attRows.push({
      ...base(user_id, input.demo),
      idea_id: idea.id,
      kind: a.kind,
      external_url: url,
      mime: a.blob?.type ?? null,
      size: a.blob?.size ?? null,
      file_name: a.file_name ?? null,
      duration_ms: a.duration_ms ?? null,
      storage_key: null,
      upload_state: a.kind === "url" ? "uploaded" : "pending",
      note: a.note ?? null,
    });
  }

  // One transaction commits the idea, attachment refs and bytes before the UI reports Saved.
  await db.transaction("rw", [db.ideas, db.attachments, db.files, db.outbox], async () => {
    await put("ideas", idea);
    for (let i = 0; i < attRows.length; i++) {
      await put("attachments", attRows[i]);
      const blob = atts[i].blob;
      if (blob) await db.files.put({ attachment_id: attRows[i].id, blob });
    }
  });
  return idea;
}

export async function updateIdea(id: string, changes: Partial<Pick<Idea, "title" | "body" | "category_id">>) {
  const c = { ...changes };
  if ("title" in c) c.title = c.title?.trim() || null;
  if ("body" in c) c.body = c.body?.trim() ? c.body : null;
  return patch<Idea>("ideas", id, c);
}

/** Status changes are always explicit (never derived from task completion). */
export async function setIdeaStatus(id: string, status: IdeaStatus) {
  return patch<Idea>("ideas", id, { status });
}

/** Delete idea: tombstone idea + attachments; linked tasks are preserved and unlinked (TASK-01 proposal). */
export async function deleteIdea(id: string) {
  const db = getDb();
  const ts = nowIso();
  await db.transaction("rw", [db.ideas, db.attachments, db.files, db.tasks, db.platform_plans, db.outbox], async () => {
    await patch<Idea>("ideas", id, { deleted_at: ts });
    for (const a of await db.attachments.where("idea_id").equals(id).toArray()) {
      await patch<Attachment>("attachments", a.id, { deleted_at: ts });
      await db.files.delete(a.id);
    }
    for (const p of await db.platform_plans.where("idea_id").equals(id).toArray()) {
      await patch<PlatformPlan>("platform_plans", p.id, { deleted_at: ts });
    }
    for (const tk of await db.tasks.where("idea_id").equals(id).toArray()) {
      await patch<Task>("tasks", tk.id, { idea_id: null });
    }
  });
}

export async function addAttachment(ideaId: string, a: NewAttachmentInput) {
  const db = getDb();
  const count = await db.attachments.where("idea_id").equals(ideaId).filter((x) => !x.deleted_at).count();
  if (count >= LIMITS.attachmentsPerIdea) throw new ValidationError("capture.error.empty");
  if (a.kind !== "url" && a.blob) validateFile(a.blob, a.kind);
  let url: string | null = null;
  if (a.kind === "url") {
    url = normalizeUrl(a.url ?? "");
    if (!url) throw new ValidationError("capture.error.link");
  }
  const row: Attachment = {
    ...base(await ownerId()),
    idea_id: ideaId,
    kind: a.kind,
    external_url: url,
    mime: a.blob?.type ?? null,
    size: a.blob?.size ?? null,
    file_name: a.file_name ?? null,
    duration_ms: a.duration_ms ?? null,
    storage_key: null,
    upload_state: a.kind === "url" ? "uploaded" : "pending",
    note: a.note ?? null,
  };
  await db.transaction("rw", [db.attachments, db.files, db.outbox, db.ideas], async () => {
    await put("attachments", row);
    if (a.blob) await db.files.put({ attachment_id: row.id, blob: a.blob });
    await patch<Idea>("ideas", ideaId, {});
  });
  return row;
}

export async function removeAttachment(id: string) {
  const db = getDb();
  await db.transaction("rw", [db.attachments, db.files, db.outbox], async () => {
    await patch<Attachment>("attachments", id, { deleted_at: nowIso() });
    await db.files.delete(id);
  });
}

export async function saveTranscript(attachment_id: string, text: string, language: string | null = null) {
  const db = getDb();
  const existing = await db.transcripts.where("attachment_id").equals(attachment_id).first();
  if (existing) return patch<Transcript>("transcripts", existing.id, { text, status: "done", language });
  const row: Transcript = { ...base(await ownerId()), attachment_id, text, status: "done", language };
  await put("transcripts", row);
  return row;
}

// ---------- categories ----------

export const normalizeCategory = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

export async function createCategory(name: string, demo = false): Promise<Category> {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) throw new ValidationError("settings.categories.placeholder");
  const normalized = normalizeCategory(clean);
  const existing = await getDb()
    .categories.where("normalized")
    .equals(normalized)
    .filter((c) => !c.deleted_at)
    .first();
  if (existing) throw new ValidationError("settings.categories.duplicate");
  const row: Category = { ...base(await ownerId(), demo), name: clean, normalized };
  await put("categories", row);
  return row;
}

export async function deleteCategory(id: string) {
  const db = getDb();
  await db.transaction("rw", [db.categories, db.ideas, db.outbox], async () => {
    await patch<Category>("categories", id, { deleted_at: nowIso() });
    for (const i of await db.ideas.where("category_id").equals(id).toArray()) {
      await patch<Idea>("ideas", i.id, { category_id: null });
    }
  });
}

// ---------- platform plans ----------

export async function addPlatformPlan(idea_id: string, platform: Platform) {
  const db = getDb();
  const dup = await db.platform_plans
    .where("idea_id")
    .equals(idea_id)
    .filter((p) => !p.deleted_at && p.platform === platform)
    .first();
  if (dup) return dup;
  const row: PlatformPlan = {
    ...base(await ownerId()),
    idea_id,
    platform,
    other_label: null,
    notes: null,
    target_at: null,
    publish_state: "draft",
  };
  await put("platform_plans", row);
  return row;
}

export async function updatePlatformPlan(
  id: string,
  changes: Partial<Pick<PlatformPlan, "notes" | "target_at" | "publish_state" | "other_label">> & { publish_state?: PublishState },
) {
  return patch<PlatformPlan>("platform_plans", id, changes);
}

export async function removePlatformPlan(id: string) {
  return patch<PlatformPlan>("platform_plans", id, { deleted_at: nowIso() });
}

// ---------- tasks & reminders ----------

export interface ReminderSpec {
  mode: ReminderMode;
  offset_minutes?: number;
  custom_at?: Date;
}

export function computeRemindAt(task: Pick<Task, "due_date" | "due_time">, spec: ReminderSpec): Date {
  const due = dueInstant(task.due_date, task.due_time);
  let at: Date;
  if (spec.mode === "custom") {
    if (!spec.custom_at || Number.isNaN(spec.custom_at.getTime())) throw new ValidationError("task.reminder.past");
    at = spec.custom_at;
  } else {
    if (!due) throw new ValidationError("task.reminder.needs_time");
    at = new Date(due.getTime() - (spec.mode === "before" ? (spec.offset_minutes ?? 0) : 0) * 60_000);
    if (at.getTime() > due.getTime()) throw new ValidationError("task.reminder.after_due");
  }
  if (at.getTime() <= Date.now()) throw new ValidationError("task.reminder.past");
  return at;
}

export interface TaskInput {
  title: string;
  idea_id?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  reminder?: ReminderSpec | null;
  demo?: boolean;
}

function cleanTask(input: TaskInput) {
  const title = input.title.trim();
  if (!title) throw new ValidationError("task.error.title");
  const due_date = input.due_date || null;
  const due_time = due_date ? input.due_time || null : null;
  return { title: title.slice(0, LIMITS.taskTitle), idea_id: input.idea_id ?? null, due_date, due_time };
}

export async function createTask(input: TaskInput): Promise<Task> {
  const c = cleanTask(input);
  const remindAt = input.reminder ? computeRemindAt(c, input.reminder) : null; // validate before writing
  const user_id = await ownerId();
  const task: Task = {
    ...base(user_id, input.demo),
    ...c,
    is_completed: false,
    completed_at: null,
    timezone: localTz(),
  };
  const db = getDb();
  await db.transaction("rw", [db.tasks, db.reminders, db.outbox], async () => {
    await put("tasks", task);
    if (input.reminder && remindAt) await writeReminder(task, input.reminder, remindAt);
  });
  return task;
}

export async function updateTask(id: string, input: TaskInput) {
  const c = cleanTask(input);
  const remindAt = input.reminder ? computeRemindAt(c, input.reminder) : null;
  const db = getDb();
  await db.transaction("rw", [db.tasks, db.reminders, db.outbox], async () => {
    const task = await patch<Task>("tasks", id, c);
    await cancelReminders(id);
    if (input.reminder && remindAt) await writeReminder(task, input.reminder, remindAt);
  });
}

async function writeReminder(task: Task, spec: ReminderSpec, at: Date) {
  const row: Reminder = {
    ...base(task.user_id, task.demo),
    task_id: task.id,
    mode: spec.mode,
    offset_minutes: spec.mode === "before" ? (spec.offset_minutes ?? 0) : null,
    remind_at: at.toISOString(),
    snoozed_until: null,
    state: "scheduled",
  };
  await put("reminders", row);
}

async function cancelReminders(task_id: string, state: Reminder["state"] = "cancelled") {
  const db = getDb();
  for (const r of await db.reminders.where("task_id").equals(task_id).toArray()) {
    if (r.state === "scheduled" || r.state === "fired") await patch<Reminder>("reminders", r.id, { state });
  }
}

/** Complete / reopen. Completing cancels pending reminders; never touches the linked idea. Idempotent. */
export async function setTaskCompleted(id: string, done: boolean) {
  const db = getDb();
  const task = await db.tasks.get(id);
  if (!task || task.deleted_at || task.is_completed === done) return;
  await db.transaction("rw", [db.tasks, db.reminders, db.outbox], async () => {
    await patch<Task>("tasks", id, { is_completed: done, completed_at: done ? nowIso() : null });
    if (done) await cancelReminders(id, "done");
  });
}

export async function deleteTask(id: string) {
  const db = getDb();
  await db.transaction("rw", [db.tasks, db.reminders, db.outbox], async () => {
    await patch<Task>("tasks", id, { deleted_at: nowIso() });
    await cancelReminders(id);
  });
}

/** Snooze moves the next alert only; due date and completion are untouched (REM-02). */
export async function snoozeReminder(id: string, minutes: number) {
  const r = await getDb().reminders.get(id);
  if (!r || r.state === "done" || r.state === "cancelled") return;
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  await patch<Reminder>("reminders", id, { snoozed_until: until, state: "scheduled" });
}

export async function markReminderFired(id: string) {
  return patch<Reminder>("reminders", id, { state: "fired" });
}

export const effectiveRemindAt = (r: Reminder) => r.snoozed_until ?? r.remind_at;
