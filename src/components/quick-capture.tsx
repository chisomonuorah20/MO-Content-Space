"use client";

import { ArrowLeft, Camera, ImagePlus, Link2, Mic, Pause, PenLine, Play, Square, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { t, type CopyKey } from "@/lib/copy";
import { useCategories } from "@/lib/hooks";
import { createIdea, uid, ValidationError, type NewAttachmentInput } from "@/lib/repo";
import { Button, cx, Field, inputClass, Sheet } from "./ui";

export type CaptureMode = "write" | "record" | "photo" | "link";

export const CAPTURE_MODES: { mode: CaptureMode; key: CopyKey; Icon: typeof PenLine }[] = [
  { mode: "write", key: "capture.action.write", Icon: PenLine },
  { mode: "record", key: "capture.action.record", Icon: Mic },
  { mode: "photo", key: "capture.action.photo", Icon: Camera },
  { mode: "link", key: "capture.action.link", Icon: Link2 },
];

const DRAFT_KEY = "mo.capture.draft";

function useObjectUrl(blob: Blob | null) {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

function readDraft(): { title?: string; body?: string } | null {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    return d && (d.title || d.body) ? d : null;
  } catch {
    return null;
  }
}

function errorText(e: unknown): string {
  if (e instanceof ValidationError) {
    const [key, limit] = e.message.split(":");
    return t(key as CopyKey, limit ? { limit } : undefined);
  }
  if (e instanceof DOMException && e.name === "QuotaExceededError") return t("error.storage");
  return t("error.generic");
}

export function QuickCapture({
  open,
  initialMode,
  onClose,
  onSaved,
}: {
  open: boolean;
  initialMode: CaptureMode | null;
  onClose: () => void;
  onSaved: (ideaId: string, addTask: boolean) => void;
}) {
  const categories = useCategories();
  // Provisional local draft (write mode) is restored on open. Draft ≠ saved idea (§15.5).
  const [draft] = useState(() => (typeof window === "undefined" || (initialMode && initialMode !== "write") ? null : readDraft()));
  const [mode, setMode] = useState<CaptureMode | null>(initialMode ?? (draft ? "write" : null));
  const [clientId] = useState(uid); // stable per capture session → double-tap safe
  const [title, setTitle] = useState(draft?.title ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [link, setLink] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [addTask, setAddTask] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [audio, setAudio] = useState<{ blob: Blob; ms: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const savedRef = useRef(false);
  useEffect(() => {
    if (mode !== "write" || !open) return;
    const id = setTimeout(() => {
      try {
        if (savedRef.current) return;
        if (title || body) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body }));
          setDraftSaved(true);
        } else localStorage.removeItem(DRAFT_KEY);
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [title, body, mode, open]);

  useEffect(() => {
    if (mode === "write") bodyRef.current?.focus();
  }, [mode]);

  async function save() {
    setError(null);
    const atts: NewAttachmentInput[] = [];
    if (mode === "photo" && photo) atts.push({ kind: "image", blob: photo, file_name: photo.name });
    if (mode === "record" && audio) atts.push({ kind: "audio", blob: audio.blob, duration_ms: audio.ms, file_name: "recording.webm" });
    if (mode === "link" && link.trim()) atts.push({ kind: "url", url: link });
    setSaving(true);
    try {
      const idea = await createIdea({ clientId, title, body, category_id: categoryId || null, attachments: atts });
      savedRef.current = true;
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      onSaved(idea.id, addTask);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }

  const canSave =
    (mode === "write" && (body.trim() || title.trim())) ||
    (mode === "photo" && photo) ||
    (mode === "record" && audio) ||
    (mode === "link" && link.trim());

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("capture.entry.title")}
      description={mode ? undefined : t("capture.entry.subtitle")}
      footer={
        mode && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted" aria-live="polite">
              {mode === "write" && draftSaved ? t("state.draft_local") : ""}
            </span>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>
                {t("action.cancel")}
              </Button>
              <Button onClick={save} loading={saving} disabled={!canSave}>
                {mode === "record" ? t("capture.record.save") : t("action.save_idea")}
              </Button>
            </div>
          </div>
        )
      }
    >
      {!mode ? (
        <div className="grid grid-cols-2 gap-3 pt-2 pb-4 sm:grid-cols-4">
          {CAPTURE_MODES.map(({ mode: m, key, Icon }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-tile border border-transparent bg-canvas p-4 transition-colors hover:border-sage hover:bg-sage/40"
            >
              <span className="flex size-11 items-center justify-center rounded-control bg-surface text-primary shadow-card">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-semibold">{t(key)}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5 pt-1">
          <div className="flex items-center gap-2">
            {!initialMode && (
              <button onClick={() => setMode(null)} aria-label={t("capture.back")} title={t("capture.back")} className="-ml-2 rounded-full p-2 text-muted hover:bg-canvas hover:text-ink">
                <ArrowLeft className="size-4" />
              </button>
            )}
            <div role="tablist" aria-label={t("capture.entry.title")} className="flex flex-wrap gap-1.5">
              {CAPTURE_MODES.map(({ mode: m, key, Icon }) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={cx(
                    "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold",
                    mode === m ? "bg-sage text-primary" : "text-muted hover:bg-canvas",
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {t(key)}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("capture.title.label")}>
            {(id) => <input id={id} className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />}
          </Field>

          {mode === "write" && (
            <Field label={t("capture.body.label")}>
              {(id) => (
                <textarea
                  id={id}
                  ref={bodyRef}
                  rows={5}
                  className={cx(inputClass, "min-h-32 resize-y")}
                  placeholder={t("capture.body.placeholder")}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              )}
            </Field>
          )}

          {mode === "record" && <Recorder value={audio} onChange={setAudio} onError={setError} />}

          {mode === "photo" && <PhotoPicker value={photo} onChange={setPhoto} onError={setError} />}

          {mode === "link" && (
            <Field label={t("capture.link.label")}>
              {(id) => (
                <input id={id} type="url" inputMode="url" className={inputClass} placeholder={t("capture.link.placeholder")} value={link} onChange={(e) => setLink(e.target.value)} />
              )}
            </Field>
          )}

          {mode !== "write" && (
            <Field label={t("capture.note.label")}>
              {(id) => <textarea id={id} rows={2} className={cx(inputClass, "resize-y")} value={body} onChange={(e) => setBody(e.target.value)} />}
            </Field>
          )}

          {categories && categories.length > 0 && (
            <Field label={t("capture.category.label")}>
              {(id) => (
                <select id={id} className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          )}

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
            <input type="checkbox" className="size-5 accent-primary" checked={addTask} onChange={(e) => setAddTask(e.target.checked)} />
            {t("capture.linked_task.label")}
          </label>

          {error && (
            <p role="alert" className="rounded-control bg-danger-tint px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function PhotoPicker({ value, onChange, onError }: { value: File | null; onChange: (f: File | null) => void; onError: (e: string | null) => void }) {
  const preview = useObjectUrl(value);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return onError(t("capture.error.file_type"));
    onError(null);
    onChange(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        accept(e.dataTransfer.files[0]);
      }}
      className={cx("rounded-tile border-2 border-dashed p-4 text-center transition-colors", drag ? "border-primary bg-sage/40" : "border-line")}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={value?.name ?? ""} className="mx-auto max-h-64 rounded-control object-contain" />
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 text-muted">
          <ImagePlus className="size-8 text-primary" aria-hidden />
          <p className="text-sm">{t("capture.photo.drop")}</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
      <Button variant="secondary" className="mt-3" onClick={() => inputRef.current?.click()}>
        <Camera className="size-4" aria-hidden /> {t("capture.photo.choose")}
      </Button>
    </div>
  );
}

function Recorder({ value, onChange, onError }: { value: { blob: Blob; ms: number } | null; onChange: (v: { blob: Blob; ms: number } | null) => void; onError: (e: string | null) => void }) {
  const [phase, setPhase] = useState<"idle" | "recording" | "paused" | "done">(value ? "done" : "idle");
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const accumulated = useRef(0);
  const url = useObjectUrl(value?.blob ?? null);

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setElapsed(accumulated.current + Date.now() - startedAt.current), 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => rec.current?.stream.getTracks().forEach((tr) => tr.stop()), []);

  async function start() {
    onError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      chunks.current = [];
      accumulated.current = 0;
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks.current, { type: r.mimeType || "audio/webm" });
        onChange({ blob, ms: accumulated.current });
        setPhase("done");
      };
      r.start(500);
      rec.current = r;
      startedAt.current = Date.now();
      setPhase("recording");
    } catch {
      onError(t("error.permission.mic"));
    }
  }
  function pause() {
    rec.current?.pause();
    accumulated.current += Date.now() - startedAt.current;
    setPhase("paused");
  }
  function resume() {
    rec.current?.resume();
    startedAt.current = Date.now();
    setPhase("recording");
  }
  function stop() {
    if (phase === "recording") accumulated.current += Date.now() - startedAt.current;
    rec.current?.stop();
  }

  const secs = Math.round((phase === "done" ? (value?.ms ?? 0) : elapsed) / 1000);
  const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-tile bg-canvas p-5 text-center">
      <div className={cx("mx-auto mb-3 flex size-16 items-center justify-center rounded-full", phase === "recording" ? "bg-coral/40 text-coral-ink" : "bg-sage text-primary")}>
        <Mic className={cx("size-7", phase === "recording" && "animate-pulse")} aria-hidden />
      </div>
      <p className="font-display text-2xl font-bold tabular-nums" aria-live="polite">
        {clock}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {phase === "idle" && (
          <Button onClick={start}>
            <Zap className="size-4" aria-hidden /> {t("capture.record.start")}
          </Button>
        )}
        {phase === "recording" && (
          <>
            <Button variant="secondary" onClick={pause}>
              <Pause className="size-4" aria-hidden /> {t("capture.record.pause")}
            </Button>
            <Button onClick={stop}>
              <Square className="size-4" aria-hidden /> {t("capture.record.stop")}
            </Button>
          </>
        )}
        {phase === "paused" && (
          <>
            <Button variant="secondary" onClick={resume}>
              <Play className="size-4" aria-hidden /> {t("capture.record.resume")}
            </Button>
            <Button onClick={stop}>
              <Square className="size-4" aria-hidden /> {t("capture.record.stop")}
            </Button>
          </>
        )}
        {phase === "done" && url && (
          <div className="w-full space-y-3">
            <audio controls src={url} className="w-full" />
            <Button
              variant="ghost"
              onClick={() => {
                onChange(null);
                setElapsed(0);
                setPhase("idle");
              }}
            >
              {t("capture.record.start")}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">{t("capture.record.hint")}</p>
    </div>
  );
}
