"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getDb } from "./db";
import { syncStore } from "./sync";
import { t } from "./copy";
import type { Attachment, Category, Idea, Profile, Reminder, Task } from "./types";

export function useProfile(): Profile | undefined | null {
  // null = loaded and absent; undefined = still loading
  return useLiveQuery(async () => ((await getDb().meta.get("me")) as Profile | undefined) ?? null, [], undefined);
}

export function useIdeas(): Idea[] | undefined {
  return useLiveQuery(
    () => getDb().ideas.orderBy("updated_at").reverse().filter((i) => !i.deleted_at).toArray(),
    [],
  );
}

export function useIdea(id: string): Idea | null | undefined {
  return useLiveQuery(async () => {
    const i = await getDb().ideas.get(id);
    return i && !i.deleted_at ? i : null;
  }, [id]);
}

export function useCategories(): Category[] | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().categories.filter((c) => !c.deleted_at).toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, []);
}

export function useAttachments(): Map<string, Attachment[]> | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().attachments.filter((a) => !a.deleted_at).toArray();
    const m = new Map<string, Attachment[]>();
    for (const a of all.sort((x, y) => x.created_at.localeCompare(y.created_at))) {
      m.set(a.idea_id, [...(m.get(a.idea_id) ?? []), a]);
    }
    return m;
  }, []);
}

export function useTranscripts(): Map<string, string> | undefined {
  return useLiveQuery(async () => {
    const all = await getDb().transcripts.filter((x) => !x.deleted_at).toArray();
    return new Map(all.map((x) => [x.attachment_id, x.text]));
  }, []);
}

export function useTasks(): Task[] | undefined {
  return useLiveQuery(() => getDb().tasks.filter((t) => !t.deleted_at).toArray(), []);
}

export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(
    () => getDb().reminders.filter((r) => !r.deleted_at && (r.state === "scheduled" || r.state === "fired")).toArray(),
    [],
  );
}

export function usePendingCount(): number {
  return useLiveQuery(() => getDb().outbox.count(), [], 0);
}

export function useSyncState() {
  return useSyncExternalStore(syncStore.subscribe, syncStore.get, syncStore.server);
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/** Re-render once a minute so relative times / "today" stay fresh. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function ideaLabel(i: Pick<Idea, "title" | "body">, atts?: Attachment[]): string {
  if (i.title) return i.title;
  if (i.body) return i.body.split("\n")[0].slice(0, 80);
  const first = atts?.[0];
  if (first?.kind === "audio") return t("idea.voice_note");
  if (first?.kind === "image") return t("idea.photo");
  if (first?.kind === "url") return first.external_url ?? t("idea.link");
  return t("idea.untitled");
}
