/** Data model — PRD §4. All ids are UUIDs generated on the client. */

export type IdeaStatus = "new" | "in_progress" | "completed";
export type UploadState = "local" | "pending" | "uploaded" | "error";
export type Platform = "tiktok" | "instagram" | "linkedin" | "x" | "youtube" | "facebook" | "other";
export type PublishState = "draft" | "ready" | "published";
export type ReminderMode = "at_due" | "before" | "custom";

interface Owned {
  id: string;
  user_id: string;
  created_at: string; // ISO UTC
  updated_at: string;
  deleted_at: string | null; // tombstone (soft delete)
  version: number; // server version for conflict detection (§5.2)
  demo?: boolean; // sample fixture content, clearly marked in UI
}

export interface Idea extends Owned {
  title: string | null;
  body: string | null;
  status: IdeaStatus;
  category_id: string | null;
}

export interface Category extends Owned {
  name: string;
  normalized: string;
}

export interface Attachment extends Owned {
  idea_id: string;
  kind: "image" | "audio" | "url";
  external_url: string | null;
  mime: string | null;
  size: number | null;
  file_name: string | null;
  duration_ms: number | null;
  storage_key: string | null;
  upload_state: UploadState;
  note: string | null;
}

/** Binary bytes kept in a separate local table so metadata syncs independently (§SYNC-01). */
export interface LocalFile {
  attachment_id: string;
  blob: Blob;
}

export interface Transcript extends Owned {
  attachment_id: string;
  text: string;
  status: "done" | "error";
  language: string | null;
}

export interface PlatformPlan extends Owned {
  idea_id: string;
  platform: Platform;
  other_label: string | null;
  notes: string | null;
  target_at: string | null;
  publish_state: PublishState;
}

export interface Task extends Owned {
  idea_id: string | null;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  due_date: string | null; // YYYY-MM-DD local wall date
  due_time: string | null; // HH:mm local wall time
  timezone: string | null; // IANA
}

export interface Reminder extends Owned {
  task_id: string;
  mode: ReminderMode;
  offset_minutes: number | null;
  remind_at: string; // UTC instant
  snoozed_until: string | null;
  state: "scheduled" | "fired" | "done" | "cancelled";
}

export type EntityTable =
  | "ideas"
  | "categories"
  | "attachments"
  | "transcripts"
  | "platform_plans"
  | "tasks"
  | "reminders";

export interface OutboxOp {
  op_id: string; // idempotency key
  entity_type: EntityTable;
  entity_id: string;
  state: "pending" | "error";
  attempt_count: number;
  last_error: string | null;
  created_at: string;
}

export interface Profile {
  key: "me";
  user_id: string;
  first_name: string;
  email: string | null;
  mode: "local" | "cloud";
}

export interface SyncMeta {
  key: "sync";
  cursor: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "x", label: "X" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "other", label: "Other" },
];
