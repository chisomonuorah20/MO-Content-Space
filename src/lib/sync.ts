"use client";

/**
 * Sync orchestrator — PRD §5 / SYNC-01.
 * - Local writes are authoritative for UX; each mutation leaves a durable outbox entry.
 * - When cloud is configured and the user is signed in, the worker uploads media bytes first,
 *   then upserts the row, and only clears the outbox entry after the server acknowledges it.
 * - Pull applies remote changes since a server-assigned cursor, skipping rows with unsynced local edits.
 * - Conflicts on idea text never overwrite silently: the cloud version is kept as a separate copy.
 */
import { getDb } from "./db";
import { cloudEnabled, MEDIA_BUCKET, supabase } from "./supabase";
import type { Attachment, EntityTable, Idea, Profile, SyncMeta } from "./types";

export type SyncPhase = "local_only" | "idle" | "syncing" | "error" | "offline";

interface SyncState {
  phase: SyncPhase;
  lastError: string | null;
  lastSuccessAt: string | null;
}

let state: SyncState = { phase: cloudEnabled ? "idle" : "local_only", lastError: null, lastSuccessAt: null };
const listeners = new Set<() => void>();

function set(next: Partial<SyncState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
export const syncStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  get: () => state,
  server: (): SyncState => ({ phase: "idle", lastError: null, lastSuccessAt: null }),
};

const TABLES: EntityTable[] = ["categories", "ideas", "attachments", "transcripts", "platform_plans", "tasks", "reminders"];

let timer: ReturnType<typeof setTimeout> | null = null;
let running = false;
let backoff = 2_000;

/** Debounced trigger after local mutations, reconnects and app resume. */
export function requestSync(delay = 800) {
  if (typeof window === "undefined" || !cloudEnabled) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void runSync(), delay);
}

async function profile(): Promise<Profile | undefined> {
  return (await getDb().meta.get("me")) as Profile | undefined;
}

export async function runSync(): Promise<void> {
  const sb = supabase();
  if (!sb || running) return;
  const me = await profile();
  if (!me || me.mode !== "cloud") return set({ phase: "local_only" });
  if (!navigator.onLine) return set({ phase: "offline" });

  const { data: sess } = await sb.auth.getSession();
  if (!sess.session || sess.session.user.id !== me.user_id) {
    // Expired auth pauses sync; writes stay queued (AUTH-01). Never push to another account.
    return set({ phase: "error", lastError: "auth" });
  }

  running = true;
  set({ phase: "syncing", lastError: null });
  try {
    await push(me.user_id);
    await pull(me.user_id);
    const ts = new Date().toISOString();
    const meta = ((await getDb().meta.get("sync")) as SyncMeta | undefined) ?? { key: "sync", cursor: null, last_success_at: null, last_error: null };
    await getDb().meta.put({ ...meta, last_success_at: ts, last_error: null });
    backoff = 2_000;
    set({ phase: "idle", lastSuccessAt: ts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    set({ phase: navigator.onLine ? "error" : "offline", lastError: msg });
    // Exponential backoff with jitter (§5.1 step 5).
    backoff = Math.min(backoff * 2, 5 * 60_000);
    requestSync(backoff + Math.random() * 1000);
  } finally {
    running = false;
  }
}

async function push(userId: string) {
  const sb = supabase()!;
  const db = getDb();
  const ops = await db.outbox.orderBy("created_at").toArray();
  for (const op of ops) {
    const row = (await db.table(op.entity_type).get(op.entity_id)) as (Record<string, unknown> & { id: string; user_id: string; version: number }) | undefined;
    if (!row) {
      await db.outbox.delete(op.op_id);
      continue;
    }
    if (row.user_id !== userId) throw new Error("owner mismatch — refusing to upload");
    try {
      // Upload attachment bytes before metadata (§5.1 step 2).
      if (op.entity_type === "attachments") {
        const att = row as unknown as Attachment;
        if (!att.deleted_at && att.kind !== "url" && att.upload_state !== "uploaded") {
          const file = await db.files.get(att.id);
          if (file) {
            const key = `${userId}/${att.id}`;
            const { error } = await sb.storage.from(MEDIA_BUCKET).upload(key, file.blob, { upsert: true, contentType: att.mime ?? undefined });
            if (error) throw error;
            row.storage_key = key;
            row.upload_state = "uploaded";
          }
        }
      }

      // Version check: if the server moved on since our base version, resolve without silent loss.
      const { data: remote, error: readErr } = await sb.from(op.entity_type).select("*").eq("id", row.id).maybeSingle();
      if (readErr) throw readErr;
      if (remote && remote.version > row.version && op.entity_type === "ideas") {
        await keepCloudCopy(remote as Idea);
      }
      const nextVersion = Math.max(row.version, (remote?.version as number | undefined) ?? 0) + 1;
      const payload = { ...row, version: nextVersion };
      delete (payload as Record<string, unknown>).demo;
      const { error } = await sb.from(op.entity_type).upsert(payload);
      if (error) throw error;

      // Acknowledge: update local version without creating a new outbox entry.
      await db.transaction("rw", [db.table(op.entity_type), db.outbox], async () => {
        const latest = (await db.table(op.entity_type).get(row.id)) as { updated_at: string } | undefined;
        const changedMeanwhile = latest && latest.updated_at !== row.updated_at;
        await db.table(op.entity_type).update(row.id, {
          version: nextVersion,
          ...(op.entity_type === "attachments" ? { storage_key: row.storage_key, upload_state: row.upload_state } : {}),
        });
        if (!changedMeanwhile) await db.outbox.delete(op.op_id);
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.outbox.update(op.op_id, { attempt_count: op.attempt_count + 1, last_error: msg, state: "error" });
      if (op.entity_type === "attachments") await db.attachments.update(op.entity_id, { upload_state: "error" });
      throw e;
    }
  }
}

/** "Copy Both" policy: keep the cloud text as its own idea instead of overwriting either side. */
async function keepCloudCopy(remote: Idea) {
  const db = getDb();
  const copyId = crypto.randomUUID();
  await db.ideas.put({ ...remote, id: copyId, title: `${remote.title ?? "Untitled idea"} (cloud copy)`, version: 0, updated_at: new Date().toISOString() });
  await db.outbox.put({ op_id: crypto.randomUUID(), entity_type: "ideas", entity_id: copyId, state: "pending", attempt_count: 0, last_error: null, created_at: new Date().toISOString() });
}

async function pull(userId: string) {
  const sb = supabase()!;
  const db = getDb();
  const meta = ((await db.meta.get("sync")) as SyncMeta | undefined) ?? { key: "sync" as const, cursor: null, last_success_at: null, last_error: null };
  let maxCursor = meta.cursor;
  for (const table of TABLES) {
    let q = sb.from(table).select("*").eq("user_id", userId).order("synced_at", { ascending: true }).limit(1000);
    if (meta.cursor) q = q.gt("synced_at", meta.cursor);
    const { data, error } = await q;
    if (error) throw error;
    for (const remote of data ?? []) {
      const dirty = await db.outbox.where("entity_id").equals(remote.id).count();
      if (!dirty) {
        const { synced_at, ...row } = remote;
        const local = await db.table(table).get(row.id);
        await db.table(table).put({ ...local, ...row });
        if (table === "attachments" && row.deleted_at) await db.files.delete(row.id);
        if (!maxCursor || synced_at > maxCursor) maxCursor = synced_at;
      }
    }
  }
  await db.meta.put({ ...meta, cursor: maxCursor });
}

/** Resolve a displayable URL: local bytes first, else a short-lived signed URL. */
export async function attachmentUrl(att: Attachment): Promise<string | null> {
  if (att.kind === "url") return att.external_url;
  const file = await getDb().files.get(att.id);
  if (file) return URL.createObjectURL(file.blob);
  const sb = supabase();
  if (sb && att.storage_key) {
    const { data } = await sb.storage.from(MEDIA_BUCKET).createSignedUrl(att.storage_key, 300);
    return data?.signedUrl ?? null;
  }
  return null;
}

let started = false;
export function startSyncLoop() {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => requestSync(100));
  window.addEventListener("offline", () => set({ phase: cloudEnabled ? "offline" : "local_only" }));
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && requestSync(100));
  setInterval(() => requestSync(0), 30_000);
  requestSync(100);
}
