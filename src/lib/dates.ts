import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO } from "date-fns";

export const nowIso = () => new Date().toISOString();
export const localTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Local wall date (YYYY-MM-DD) for a Date. */
export function ymd(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export const todayYmd = () => ymd(new Date());

/** Due instant for a task that has both date and time (interpreted in the device's zone). */
export function dueInstant(due_date: string | null, due_time: string | null): Date | null {
  if (!due_date || !due_time) return null;
  const d = new Date(`${due_date}T${due_time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function friendlyDay(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE d MMM");
}

export function timeLabel(d: Date): string {
  return format(d, "HH:mm");
}

export function relative(iso: string): string {
  const d = parseISO(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (isYesterday(d)) return "Yesterday";
  if (diff < 24 * 3600_000) return `${formatDistanceToNowStrict(d).replace(" hours", "h").replace(" hour", "h").replace(" minutes", "m").replace(" minute", "m")} ago`;
  if (diff < 7 * 24 * 3600_000) return format(d, "EEEE");
  return format(d, "MMM d");
}

export function greetingKey(d = new Date()): "home.greeting" | "home.greeting.afternoon" | "home.greeting.evening" {
  const h = d.getHours();
  if (h < 12) return "home.greeting";
  if (h < 18) return "home.greeting.afternoon";
  return "home.greeting.evening";
}

/** Value for <input type="datetime-local"> */
export function toLocalInput(d: Date): string {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
