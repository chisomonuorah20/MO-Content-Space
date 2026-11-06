"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { startSyncLoop } from "@/lib/sync";
import { onReminderFired, startReminderLoop } from "@/lib/reminders";
import { useProfile } from "@/lib/hooks";
import { t } from "@/lib/copy";
import type { Task } from "@/lib/types";
import { QuickCapture, type CaptureMode } from "./quick-capture";
import { TaskEditor } from "./task-editor";
import { Toasts, type Toast } from "./toasts";

interface AppCtx {
  openCapture: (mode?: CaptureMode) => void;
  openTaskEditor: (opts?: { task?: Task; ideaId?: string | null; dueDate?: string }) => void;
  toast: (message: string, action?: Toast["action"]) => void;
}

const Ctx = createContext<AppCtx | null>(null);
export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const profile = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  const [capture, setCapture] = useState<{ open: boolean; mode: CaptureMode | null; key: number }>({ open: false, mode: null, key: 0 });
  const [taskEd, setTaskEd] = useState<{ open: boolean; task?: Task; ideaId?: string | null; dueDate?: string; key: number }>({ open: false, key: 0 });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, action?: Toast["action"]) => {
    const id = crypto.randomUUID();
    setToasts((ts) => [...ts, { id, message, action }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), action ? 10_000 : 4_000);
  }, []);

  // Auth gate: a profile (local or cloud) is required before using the app (PRD §2.3).
  useEffect(() => {
    if (profile === null && pathname !== "/sign-in") router.replace("/sign-in");
    if (profile && pathname === "/sign-in") router.replace("/");
  }, [profile, pathname, router]);

  useEffect(() => {
    if (!profile) return;
    startSyncLoop();
    startReminderLoop();
    return onReminderFired((_, title) =>
      toast(`${t("reminder.due_now")}: ${title}`, { label: t("nav.reminders"), href: "/reminders" }),
    );
  }, [profile, toast]);

  const value = useMemo<AppCtx>(
    () => ({
      openCapture: (mode) => setCapture((c) => ({ open: true, mode: mode ?? null, key: c.key + 1 })),
      openTaskEditor: (opts) => setTaskEd((s) => ({ open: true, ...opts, key: s.key + 1 })),
      toast,
    }),
    [toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {profile && (
        <>
          <QuickCapture
            key={`c${capture.key}`}
            open={capture.open}
            initialMode={capture.mode}
            onClose={() => setCapture((c) => ({ ...c, open: false }))}
            onSaved={(ideaId, addTask) => {
              setCapture((c) => ({ ...c, open: false }));
              toast(t("toast.saved_idea"), { label: t("action.open"), href: `/ideas/${ideaId}` });
              // Idea is already persisted; cancelling the task editor never rolls it back (§15.5).
              if (addTask) setTaskEd((s) => ({ open: true, ideaId, task: undefined, key: s.key + 1 }));
            }}
          />
          <TaskEditor
            key={`t${taskEd.key}`}
            open={taskEd.open}
            task={taskEd.task}
            ideaId={taskEd.ideaId}
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
