"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CircleAlert, CloudUpload, Images, Link2, X } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { createIdea, IMAGE_TYPES, LIMITS, normalizeUrl, uid, ValidationError, type NewAttachmentInput } from "@/lib/repo";
import { CancelLink, EditorFrame, LeaveDialog, titleInputClass } from "@/components/editor-frame";
import { useAfterCapture, useLeave } from "@/components/use-after-capture";
import { cx } from "@/components/ui";

interface Item {
  id: string;
  file: File;
  url: string | null;
  error: CopyKey | null;
}

/** Capture_Media — photos/screenshots by drop, camera or picker, plus an optional link. */
export default function CaptureMediaPage() {
  const after = useAfterCapture();
  const leave = useLeave();
  const [clientId] = useState(uid);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pickRef = useRef<HTMLInputElement>(null);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((i) => i.url && URL.revokeObjectURL(i.url)), []);

  function add(files: FileList | File[] | null) {
    if (!files) return;
    const next: Item[] = Array.from(files).map((file) => {
      const bad = !IMAGE_TYPES.includes(file.type) ? "media.invalid.sub" : file.size > LIMITS.imageMb * 1024 * 1024 ? "capture.error.file_size" : null;
      return { id: uid(), file, url: bad ? null : URL.createObjectURL(file), error: bad as CopyKey | null };
    });
    setItems((x) => [...x, ...next]);
  }

  const valid = useMemo(() => items.filter((i) => !i.error), [items]);
  const linkOk = !link.trim() || Boolean(normalizeUrl(link));
  const dirty = Boolean(title || note || link || items.length);
  const canSave = (valid.length > 0 || (link.trim() && linkOk) || note.trim() || title.trim()) && linkOk;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const atts: NewAttachmentInput[] = valid.map((i) => ({ kind: "image", blob: i.file, file_name: i.file.name }));
      if (link.trim()) atts.push({ kind: "url", url: link });
      const idea = await createIdea({ clientId, title, body: note, attachments: atts });
      after(idea.id, false);
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      setError(t(key as CopyKey, limit ? { limit } : undefined));
      setSaving(false);
    }
  }

  const close = () => (dirty ? setConfirmLeave(true) : leave());
  const kindOf = (f: File) => (/screen/i.test(f.name) ? t("media.kind.screenshot") : t("media.kind.photo"));

  const attachments = items.length > 0 && (
    <section>
      <div className="mb-4 flex items-center justify-between px-2">
        <h2 className="eyebrow text-ink">{t("media.attachments")}</h2>
        <span className="rounded-lg bg-sage px-2.5 py-1 text-[10px] font-black text-primary">{valid.length}</span>
      </div>
      <ul className="grid grid-cols-2 gap-4">
        {items.map((i) => (
          <li
            key={i.id}
            className={cx(
              "relative flex aspect-square flex-col overflow-hidden rounded-4xl border shadow-sm",
              i.error ? "items-center justify-center border-danger/30 bg-danger-tint text-center" : "border-line bg-surface",
            )}
          >
            {i.error ? (
              <>
                <CircleAlert className="size-5 text-danger" aria-hidden />
                <p className="mt-2 text-[10px] font-black tracking-widest text-danger uppercase">{t("media.invalid")}</p>
                <p className="mt-1 px-3 text-[10px] text-danger/80">{t(i.error, { limit: LIMITS.imageMb })}</p>
              </>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url!} alt={i.file.name} className="min-h-0 w-full flex-1 object-cover" />
                <p className="px-4 py-3 text-[10px] font-black tracking-widest uppercase">{kindOf(i.file)}</p>
              </>
            )}
            <button
              onClick={() => setItems((x) => x.filter((y) => y.id !== i.id))}
              aria-label={t("media.remove")}
              title={t("media.remove")}
              className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-surface text-danger shadow"
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <EditorFrame
      title={t("editor.media")}
      onClose={close}
      primary={t("action.save_idea")}
      onPrimary={save}
      primaryDisabled={!canSave}
      saving={saving}
      secondary={<CancelLink onClick={close} />}
      footer={
        <div className="flex flex-col gap-2 pb-4 text-center lg:flex-row lg:items-center lg:justify-end lg:pb-0">
          <p className="text-[9px] font-black tracking-widest text-muted uppercase">{t("media.drag_hint")}</p>
        </div>
      }
    >
      <div
        className="mx-auto max-w-5xl px-6 pt-10 pb-16 lg:px-12 lg:pt-6"
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
      >
        <div className="space-y-5 px-2">
          <label htmlFor="m-title" className="sr-only">
            {t("capture.title.label")}
          </label>
          <input id="m-title" placeholder={t("capture.title.label")} className={cx(titleInputClass, "lg:text-3xl")} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          <label htmlFor="m-note" className="sr-only">
            {t("capture.note.label")}
          </label>
          <textarea
            id="m-note"
            rows={2}
            placeholder={t("media.note.placeholder")}
            className="w-full resize-none bg-transparent text-lg font-medium text-muted placeholder:text-muted/30 focus:outline-none lg:text-base"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mt-12 grid gap-8 lg:mt-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className={cx("rounded-5xl border-2 border-dashed p-10 text-center transition-colors", drag ? "border-primary bg-sage/40" : "border-sage bg-surface")}>
              <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-canvas text-primary">
                <CloudUpload className="size-7" aria-hidden />
              </span>
              <p className="text-lg font-black tracking-tight uppercase">{t("media.drop")}</p>
              <p className="mt-2 text-sm text-muted">{t("media.supports")}</p>
              <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:justify-center">
                <button onClick={() => cameraRef.current?.click()} className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-canvas px-5 text-[11px] font-black tracking-widest uppercase shadow-sm hover:bg-sage/40 lg:border lg:border-line lg:bg-surface">
                  <Camera className="size-4 text-primary" aria-hidden /> {t("media.take")}
                </button>
                <button onClick={() => pickRef.current?.click()} className="flex min-h-12 items-center justify-center gap-3 rounded-2xl bg-canvas px-5 text-[11px] font-black tracking-widest uppercase shadow-sm hover:bg-sage/40 lg:border lg:border-line lg:bg-surface">
                  <Images className="size-4 text-primary" aria-hidden /> {t("media.choose")}
                </button>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} onChange={(e) => add(e.target.files)} />
              <input ref={pickRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => add(e.target.files)} />
            </div>

            <div className="rounded-4xl border border-line bg-surface p-6 shadow-sm">
              <label htmlFor="m-link" className="eyebrow mb-3 block">
                {t("media.link")}
              </label>
              <div className="relative">
                <Link2 className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-primary" aria-hidden />
                <input
                  id="m-link"
                  type="url"
                  inputMode="url"
                  placeholder="https://..."
                  aria-invalid={!linkOk}
                  className={cx("w-full rounded-2xl bg-canvas py-3.5 pr-4 pl-12 text-sm font-medium placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-primary/10", !linkOk && "ring-2 ring-danger/40")}
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              {!linkOk && (
                <p role="alert" className="mt-2 ml-1 text-xs text-danger">
                  {t("capture.error.link")}
                </p>
              )}
            </div>
          </div>
          {attachments}
        </div>
        {error && (
          <p role="alert" className="mt-6 rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
      <LeaveDialog open={confirmLeave} onStay={() => setConfirmLeave(false)} onDiscard={leave} />
    </EditorFrame>
  );
}
