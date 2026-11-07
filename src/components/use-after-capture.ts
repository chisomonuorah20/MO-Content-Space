"use client";

import { useRouter } from "next/navigation";
import { t } from "@/lib/copy";
import { useApp } from "./app-provider";

/** After an idea is persisted: go to it, confirm locally, optionally open a linked task (§15.5). */
export function useAfterCapture() {
  const router = useRouter();
  const { toast, openTaskEditor } = useApp();
  return (ideaId: string, addTask: boolean) => {
    router.replace(`/ideas/${ideaId}`);
    toast(t("toast.saved_idea"));
    // The idea is already saved; cancelling the task composer never rolls it back.
    if (addTask) openTaskEditor({ ideaId });
  };
}

export function useLeave() {
  const router = useRouter();
  return () => (window.history.length > 1 ? router.back() : router.replace("/"));
}
