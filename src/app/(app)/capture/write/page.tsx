"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, Paperclip, Plus, X } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { createIdea, uid, ValidationError } from "@/lib/repo";
import { CancelLink, EditorFrame, bodyInputClass, titleInputClass } from "@/components/editor-frame";
import { useAfterCapture, useLeave } from "@/components/use-after-capture";
import { cx } from "@/components/ui";

const DRAFT = "mo.capture.draft";

function readDraft(): { title?: string; body?: string } {
  try {
    return JSON.parse(localStorage.getItem(DRAFT) ?? "{}");
  } catch {
    return {};
  }
}

/** Write_Idea */
export default function WriteIdeaPage() {
  const after = useAfterCapture();
  const leave = useLeave();
  const [draft] = useState(() => (typeof window === "undefined" ? {} : readDraft()));
  const [clientId] = useState(uid);
  const [title, setTitle] = useState(draft.title ?? "");
  const [body, setBody] = useState(draft.body ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [addTask, setAddTask] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saved = useRef(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => bodyRef.current?.focus(), []);

  // Provisional local draft — distinct from a saved idea (§15.5).
  useEffect(() => {
    const id = setTimeout(() => {
      if (saved.current) return;
      try {
        if (title || body) localStorage.setItem(DRAFT, JSON.stringify({ title, body }));
        else localStorage.removeItem(DRAFT);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [title, body]);

  const previews = useMemo(() => files.map((f) => ({ f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const idea = await createIdea({ clientId, title, body, attachments: files.map((f) => ({ kind: "image" as const, blob: f, file_name: f.name })) });
      saved.current = true;
      try {
        localStorage.removeItem(DRAFT);
      } catch {}
      after(idea.id, addTask);
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      setError(t(key as CopyKey, limit ? { limit } : undefined));
      setSaving(false);
    }
  }

  const canSave = Boolean(title.trim() || body.trim() || files.length);

  const taskBox = (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="peer sr-only" checked={addTask} onChange={(e) => setAddTask(e.target.checked)} />
      <span className="flex size-6 items-center justify-center rounded-lg border-2 border-sage bg-surface peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary">
        <Plus className={cx("size-3 text-white", !addTask && "invisible")} strokeWidth={3} aria-hidden />
      </span>
      <span className="text-[10px] font-black tracking-widest text-muted uppercase">{t("editor.task_after")}</span>
    </label>
  );

  return (
    <EditorFrame
      title={t("editor.write")}
      onClose={leave}
      primary={t("action.save_idea")}
      onPrimary={save}
      primaryDisabled={!canSave}
      saving={saving}
      secondary={<CancelLink onClick={leave} className="hidden lg:inline" />}
      footer={
        <div className="flex flex-col gap-5 pb-4 lg:flex-row lg:items-center lg:justify-between lg:pb-0">
          <div className="flex items-center justify-between gap-6 lg:justify-start lg:gap-8">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-primary">
              <span className="flex size-10 items-center justify-center rounded-xl bg-sage/40">
                <Paperclip className="size-4" aria-hidden />
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase">{t("editor.attach")}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
            </label>
            {taskBox}
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-[9px] font-black tracking-widest text-muted/50 uppercase">
              {t("editor.autosave")} <CircleCheck className="size-3" aria-hidden />
            </p>
            <CancelLink onClick={leave} className="lg:hidden" />
          </div>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-10 px-8 pt-10 pb-16 lg:pt-14">
        <label htmlFor="w-title" className="sr-only">
          {t("capture.title.label")}
        </label>
        <input id="w-title" placeholder={t("capture.title.label")} className={titleInputClass} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="w-body" className="sr-only">
          {t("capture.body.label")}
        </label>
        <textarea id="w-body" ref={bodyRef} placeholder={t("capture.body.placeholder")} className={cx(bodyInputClass, "min-h-[45dvh]")} value={body} onChange={(e) => setBody(e.target.value)} />
        {previews.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {previews.map(({ f, url }, i) => (
              <li key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={f.name} className="size-24 rounded-2xl object-cover shadow-sm" />
                <button
                  onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}
                  aria-label={t("media.remove")}
                  title={t("media.remove")}
                  className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-surface text-danger shadow"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </EditorFrame>
  );
}
