"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { startSyncLoop } from "@/lib/sync";
import { onReminderFired, startReminderLoop } from "@/lib/reminders";
import { useProfile } from "@/lib/hooks";
import { t } from "@/lib/copy";
import type { Task } from "@/lib/types";
import { CaptureMenu, type CaptureMode } from "./capture-menu";
import { ImportDialog, type ImportPayload } from "./import-dialog";
import { TaskComposer } from "./task-composer";
import { Toasts, type Toast } from "./toasts";

export interface TaskComposerOpts {
  task?: Task;
  ideaId?: string | null;
  planId?: string | null;
  dueDate?: string;
}

interface AppCtx {
  openCapture: (mode?: CaptureMode) => void;
  openImport: (payload?: ImportPayload) => void;
  openTaskEditor: (opts?: TaskComposerOpts) => void;
  toast: (message: string, action?: Toast["action"]) => void;
}

const Ctx = createContext<AppCtx | null>(null);
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

/** Routes reachable without a profile. */
const PUBLIC = ["/welcome", "/sign-in", "/register", "/forgot-password", "/reset-password", "/legal"];
const isPublic = (p: string) => PUBLIC.some((x) => p === x || p.startsWith(`${x}/`));
export const CAPTURE_ROUTES: Record<Exclude<CaptureMode, "link">, string> = {
  write: "/capture/write",
  record: "/capture/record",
  photo: "/capture/media",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [importState, setImportState] = useState<{ open: boolean; payload?: ImportPayload; key: number }>({ open: false, key: 0 });
  const [taskEd, setTaskEd] = useState<{ open: boolean; key: number } & TaskComposerOpts>({ open: false, key: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, action?: Toast["action"]) => {
    const id = crypto.randomUUID();
    setToasts((ts) => [...ts, { id, message, action }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), action ? 10_000 : 4_000);
  }, []);

  // Auth + onboarding gate (PRD §2.3: a profile is required before using the app).
  useEffect(() => {
    if (profile === undefined) return;
    if (profile === null) {
      if (!isPublic(pathname)) router.replace("/welcome");
      return;
    }
    if (!profile.onboarded) {
      if (pathname !== "/onboarding" && !pathname.startsWith("/legal")) router.replace("/onboarding");
      return;
    }
    if ((isPublic(pathname) && pathname !== "/reset-password" && !pathname.startsWith("/legal")) || pathname === "/onboarding") router.replace("/");
  }, [profile, pathname, router]);

  useEffect(() => {
    if (!profile) return;
    startSyncLoop();
    startReminderLoop();
    return onReminderFired((_, title) => toast(`${t("reminder.due_now")}: ${title}`, { label: t("nav.reminders"), href: "/reminders" }));
  }, [profile, toast]);

  const openImport = useCallback((payload?: ImportPayload) => setImportState((s) => ({ open: true, payload, key: s.key + 1 })), []);

  const value = useMemo<AppCtx>(
    () => ({
      openCapture: (mode) => {
        setMenuOpen(false);
        if (!mode) return setMenuOpen(true);
        if (mode === "link") return openImport();
        router.push(CAPTURE_ROUTES[mode]);
      },
      openImport,
      openTaskEditor: (opts) => setTaskEd((s) => ({ open: true, ...opts, key: s.key + 1 })),
      toast,
    }),
    [toast, router, openImport],
  );

  const ready = profile && profile.onboarded;

  return (
    <Ctx.Provider value={value}>
      {children}
      {ready && (
        <>
          <CaptureMenu open={menuOpen} onClose={() => setMenuOpen(false)} onPick={(m) => value.openCapture(m)} />
          <ImportDialog key={`i${importState.key}`} open={importState.open} initial={importState.payload} onClose={() => setImportState((s) => ({ ...s, open: false }))} />
          <TaskComposer
            key={`t${taskEd.key}`}
            open={taskEd.open}
            task={taskEd.task}
            ideaId={taskEd.ideaId}
            planId={taskEd.planId}
            dueDate={taskEd.dueDate}
            onClose={() => setTaskEd((s) => ({ ...s, open: false }))}
            onSaved={() => {
              setTaskEd((s) => ({ ...s, open: false }));
              toast(t("toast.saved_task"));
            }}
          />
        </>
      )}
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((x) => x.id !== id))} />
    </Ctx.Provider>
  );
}
