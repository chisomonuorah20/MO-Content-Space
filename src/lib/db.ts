import Dexie, { type Table } from "dexie";
import type {
  Attachment,
  Category,
  Idea,
  LocalFile,
  OutboxOp,
  PlatformPlan,
  Profile,
  Reminder,
  SyncMeta,
  Task,
  Transcript,
} from "./types";

/**
 * Local source of truth (PRD §2.1, §5). IndexedDB is the web equivalent of the SQLite store
 * proposed for the native app: writes commit here first, then the outbox replicates them.
 */
export class MoDB extends Dexie {
  ideas!: Table<Idea, string>;
  categories!: Table<Category, string>;
  attachments!: Table<Attachment, string>;
  files!: Table<LocalFile, string>;
  transcripts!: Table<Transcript, string>;
  platform_plans!: Table<PlatformPlan, string>;
  tasks!: Table<Task, string>;
  reminders!: Table<Reminder, string>;
  outbox!: Table<OutboxOp, string>;
  meta!: Table<Profile | SyncMeta, string>;

  constructor() {
    super("mo-content-space");
    this.version(1).stores({
      ideas: "id, updated_at, status, category_id, deleted_at",
      categories: "id, normalized, deleted_at",
      attachments: "id, idea_id, upload_state, deleted_at",
      files: "attachment_id",
      transcripts: "id, attachment_id",
      platform_plans: "id, idea_id",
      tasks: "id, idea_id, due_date, is_completed, deleted_at",
      reminders: "id, task_id, remind_at, state",
      outbox: "op_id, entity_id, state, created_at",
      meta: "key",
    });
  }
}

let _db: MoDB | null = null;
export function getDb(): MoDB {
  if (typeof window === "undefined") throw new Error("Local database is only available in the browser");
  if (!_db) _db = new MoDB();
  return _db;
}
