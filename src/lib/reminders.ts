"use client";

/**
 * In-browser reminder scheduler (REM-01/02).
 * The web has no reliable background alarms, so this fires while the app is open (or resumes),
 * shows a browser notification when permission is granted, and always surfaces the reminder in-app
 * with Snooze / Mark Complete. Delivery is best-effort, never promised to the second.
 */
import { getDb } from "./db";
import { effectiveRemindAt, markReminderFired } from "./repo";
import { t } from "./copy";

type FireListener = (reminderId: string, taskTitle: string) => void;
const listeners = new Set<FireListener>();
export function onReminderFired(l: FireListener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

let timeout: ReturnType<typeof setTimeout> | null = null;

export async function checkReminders() {
  const db = getDb();
  const now = Date.now();
  const scheduled = await db.reminders.where("state").equals("scheduled").toArray();
  let next = Infinity;
  for (const r of scheduled) {
    if (r.deleted_at) continue;
    const at = new Date(effectiveRemindAt(r)).getTime();
    if (at <= now) {
      const task = await db.tasks.get(r.task_id);
      if (!task || task.deleted_at || task.is_completed) continue;
      await markReminderFired(r.id);
      notify(r.id, task.title, task.id);
      listeners.forEach((l) => l(r.id, task.title));
    } else {
      next = Math.min(next, at);
    }
  }
  if (timeout) clearTimeout(timeout);
  const wait = Math.min(Math.max(next - Date.now(), 1000), 60_000);
  timeout = setTimeout(() => void checkReminders(), Number.isFinite(wait) ? wait : 60_000);
}

function notify(reminderId: string, title: string, taskId: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, { body: t("reminder.due_now"), tag: reminderId, icon: "/icon.svg" });
    n.onclick = () => {
      window.focus();
      // Outside React (notification callback), so a plain navigation is the right tool here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/reminders?task=${taskId}`;
    };
  } catch {
    /* some browsers require a service worker for notifications; the in-app banner still shows */
  }
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  return Notification.requestPermission();
}

let started = false;
export function startReminderLoop() {
  if (started || typeof window === "undefined") return;
  started = true;
  void checkReminders();
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && void checkReminders());
}
