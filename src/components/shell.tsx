"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, CloudOff, CloudUpload, House, Lightbulb, ListChecks, Plus, RefreshCw, Search, Settings, CircleCheck, TriangleAlert, HardDrive } from "lucide-react";
import type { ReactNode } from "react";
import { t, type CopyKey } from "@/lib/copy";
import { useOnline, usePendingCount, useProfile, useReminders, useSyncState } from "@/lib/hooks";
import { runSync } from "@/lib/sync";
import { useApp } from "./app-provider";
import { Blobs, cx, IconButton, Logo } from "./ui";

const NAV: { href: string; key: CopyKey; Icon: typeof House }[] = [
  { href: "/", key: "nav.home", Icon: House },
  { href: "/ideas", key: "nav.ideas", Icon: Lightbulb },
  { href: "/tasks", key: "nav.tasks", Icon: ListChecks },
  { href: "/calendar", key: "nav.calendar", Icon: CalendarDays },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Full-screen flows on mobile (designs show no bottom nav there). */
const FOCUS_ROUTES = [/^\/capture\//, /^\/ideas\/[^/]+\/edit$/, /^\/ideas\/[^/]+\/voice\//];
export const isFocusRoute = (p: string) => FOCUS_ROUTES.some((r) => r.test(p));
/** Pages that draw their own edge-to-edge desktop layout (side panels). */
const BLEED_ROUTES = [/^\/ideas\/[^/]+$/, /^\/ideas\/[^/]+\/plans\/[^/]+$/, /^\/tasks$/];
const isBleedRoute = (p: string) => BLEED_ROUTES.some((r) => r.test(p));

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const focus = isFocusRoute(pathname);
  const bleed = isBleedRoute(pathname);
  return (
    <div className="flex min-h-dvh">
      <Blobs />
      <Sidebar />
      <main className={cx("min-w-0 flex-1", !focus && (bleed ? "px-5 pt-6 pb-32 sm:px-8 lg:p-0" : "px-5 pt-6 pb-32 sm:px-8 lg:px-12 lg:pt-12 lg:pb-16"))}>
        {focus || bleed ? children : <div className="mx-auto w-full max-w-[1200px]">{children}</div>}
      </main>
      {!focus && <BottomNav />}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const link = (href: string, key: CopyKey, Icon: typeof House) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm transition-colors",
          active ? "bg-canvas font-bold text-primary" : "font-medium text-muted hover:bg-canvas hover:text-ink",
        )}
      >
        <Icon className="size-4" strokeWidth={active ? 2.5 : 2} aria-hidden />
        <span>{t(key)}</span>
      </Link>
    );
  };
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="p-6 pt-8">
        <Link href="/" className="mb-10 flex px-2">
          <Logo size="sm" />
        </Link>
        <nav aria-label="Main" className="space-y-1">
          {NAV.map(({ href, key, Icon }) => link(href, key, Icon))}
        </nav>
      </div>
      <div className="mt-auto border-t border-line p-6">{link("/settings", "nav.settings", Settings)}</div>
    </aside>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const { openCapture } = useApp();
  const item = ({ href, key, Icon }: (typeof NAV)[number]) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx("flex min-h-11 min-w-14 flex-col items-center justify-center gap-1", active ? "text-primary" : "text-muted")}
      >
        <Icon className="size-6" strokeWidth={active ? 2.5 : 2} aria-hidden />
        <span className="text-[10px] font-black tracking-widest uppercase">{t(key)}</span>
      </Link>
    );
  };
  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-line bg-surface px-6 pt-3 shadow-[0_-5px_15px_-5px_rgb(0_0_0/0.04)] lg:hidden">
      {NAV.slice(0, 2).map(item)}
      <div className="relative -mt-12">
        <button
          onClick={() => openCapture()}
          aria-label={t("nav.capture")}
          title={t("nav.capture")}
          className="flex size-16 items-center justify-center rounded-3xl border-4 border-surface bg-primary text-white shadow-lg shadow-primary/25 transition-transform active:scale-90"
        >
          <Plus className="size-7" aria-hidden />
        </button>
      </div>
      {NAV.slice(2).map(item)}
    </nav>
  );
}

export function Avatar({ size = "md" }: { size?: "md" | "lg" }) {
  const profile = useProfile();
  const initial = profile?.first_name?.[0]?.toUpperCase() ?? "·";
  return (
    <Link
      href="/settings"
      aria-label={t("nav.profile")}
      title={t("nav.profile")}
      className={cx(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 border-sage bg-coral/40 font-display font-bold text-coral-ink",
        size === "md" ? "size-11" : "size-12",
      )}
    >
      {initial}
    </Link>
  );
}

export function NotificationsButton() {
  const reminders = useReminders();
  const due = reminders?.some((r) => r.state === "fired");
  return (
    <Link
      href="/reminders"
      aria-label={t("nav.notifications")}
      title={t("nav.notifications")}
      className="relative inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-primary"
    >
      <Bell className="size-5" aria-hidden />
      {due && <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full border-2 border-surface bg-coral" />}
    </Link>
  );
}

export function SearchButton() {
  return (
    <Link href="/ideas?focus=search" aria-label={t("nav.search")} title={t("nav.search")} className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-primary">
      <Search className="size-5" aria-hidden />
    </Link>
  );
}

/** Sync status pill — distinguishes local, pending, syncing, synced and error (UI-08). */
export function SyncStatus({ compact }: { compact?: boolean }) {
  const s = useSyncState();
  const pending = usePendingCount();
  const online = useOnline();
  const profile = useProfile();

  let Icon = CircleCheck;
  let text = t("state.synced");
  let tone = "bg-sage text-primary";
  if (!profile || profile.mode === "local") {
    Icon = HardDrive;
    text = t("state.local_only");
  } else if (!online) {
    Icon = CloudOff;
    text = pending ? t("state.offline_pending", { pendingCount: pending }) : t("state.saved_local");
  } else if (s.phase === "syncing") {
    Icon = RefreshCw;
    text = t("state.syncing");
  } else if (s.phase === "error") {
    Icon = TriangleAlert;
    text = t("error.sync.title");
    tone = "bg-danger-tint text-danger";
  } else if (pending) {
    Icon = CloudUpload;
    text = t("state.pending", { pendingCount: pending });
  }

  const pill = (
    <span role="status" className={cx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold", compact ? "text-xs" : "text-xs md:text-sm", tone)}>
      <Icon className={cx("size-3.5", s.phase === "syncing" && "animate-spin")} aria-hidden />
      <span>{text}</span>
    </span>
  );
  if (s.phase === "error") {
    return (
      <span className="inline-flex items-center gap-2">
        {pill}
        <button onClick={() => void runSync()} className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
          {t("action.retry")}
        </button>
      </span>
    );
  }
  return pill;
}

/** Standard page top bar for non-Home pages. */
export function TopBar({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4 lg:mb-10">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 font-medium text-muted">{subtitle}</p>}
        <div className="mt-2 lg:hidden">
          <SyncStatus compact />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden lg:block">
          <SyncStatus />
        </div>
        <NotificationsButton />
        <div className="hidden lg:block">
          <Avatar />
        </div>
      </div>
    </header>
  );
}

export { IconButton };
