"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, CloudOff, FileText, FolderPlus, ImageIcon, Link2, Plus, Search, Share2, X } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { ideaLabel, useAttachments, useIdeas, useOnline } from "@/lib/hooks";
import { addAttachment, createIdea, normalizeUrl, uid, updateIdea, ValidationError, type NewAttachmentInput } from "@/lib/repo";
import { getDb } from "@/lib/db";
import { cx, IconButton } from "./ui";

export interface ImportPayload {
  url?: string;
  text?: string;
  title?: string;
  file?: File;
}

/** Share_Entry (mobile sheet) / Import_Dialog (desktop card). Web stand-in for the OS share target. */
export function ImportDialog({ open, initial, onClose }: { open: boolean; initial?: ImportPayload; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const ideas = useIdeas();
  const atts = useAttachments();
  const online = useOnline();
  const [raw, setRaw] = useState(initial?.url ?? initial?.text ?? "");
  const [file, setFile] = useState<File | null>(initial?.file ?? null);
  const [mode, setMode] = useState<"choose" | "existing" | "done" | "error">("choose");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [clientId] = useState(uid);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const url = normalizeUrl(raw);
  const kind: "link" | "image" | "text" | null = file ? "image" : url ? "link" : raw.trim() ? "text" : null;
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const matches = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (ideas ?? []).filter((i) => !n || ideaLabel(i, atts?.get(i.id)).toLowerCase().includes(n) || (i.body ?? "").toLowerCase().includes(n)).slice(0, 6);
  }, [ideas, atts, q]);

  function payload(): NewAttachmentInput[] {
    const out: NewAttachmentInput[] = [];
    if (file) out.push({ kind: "image", blob: file, file_name: file.name });
    if (url) out.push({ kind: "url", url });
    return out;
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      setMode("done");
    } catch (e) {
      if (e instanceof ValidationError) {
        const [key, limit] = e.message.split(":");
        setErr(t(key as CopyKey, limit ? { limit } : undefined));
      } else setMode("error");
    } finally {
      setBusy(false);
    }
  }

  const saveNew = () =>
    run(async () => {
      await createIdea({ clientId, title: initial?.title ?? null, body: kind === "text" ? raw : null, attachments: payload() });
    });

  const saveExisting = (ideaId: string) =>
    run(async () => {
      for (const a of payload()) await addAttachment(ideaId, a);
      if (kind === "text") {
        const idea = await getDb().ideas.get(ideaId);
        await updateIdea(ideaId, { body: [idea?.body, raw.trim()].filter(Boolean).join("\n\n") });
      }
    });

  const KindIcon = kind === "image" ? ImageIcon : kind === "text" ? FileText : Link2;

  return (
    <dialog
      ref={ref}
      aria-labelledby="share-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/30 md:m-auto md:w-[26rem]"
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-5xl bg-surface shadow-raised md:rounded-5xl">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden />
          <header className="flex items-center justify-between gap-3 border-b border-line/70 px-8 pt-5 pb-5 md:pt-8">
            <div className="flex items-center gap-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <Share2 className="size-4" aria-hidden />
              </span>
              <h2 id="share-title" className="text-xl leading-tight font-black tracking-tight uppercase">
                {t("share.dialog.title")}
              </h2>
            </div>
            <IconButton label={t("action.close")} onClick={onClose} className="bg-canvas">
              <X className="size-5" />
            </IconButton>
          </header>

          <div className="scroll-thin min-h-0 flex-1 space-y-6 overflow-y-auto px-8 py-6">
            {mode === "done" ? (
              <div role="status" className="py-8 text-center">
                <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl bg-sage text-primary">
                  <Check className="size-7" strokeWidth={3} aria-hidden />
                </span>
                <p className="text-xl font-black tracking-tight uppercase">{t("share.saved.title")}</p>
                <p className="mt-2 text-sm text-muted">{t("share.saved.body")}</p>
                {!online && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-warning-tint px-3 py-1.5 text-[10px] font-black tracking-widest text-warning uppercase">
                    <CloudOff className="size-3.5" aria-hidden /> {t("share.saved.offline")}
                  </p>
                )}
              </div>
            ) : (
              <>
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="eyebrow">{t("share.incoming")}</p>
                    {kind && (
                      <span className="rounded-md bg-sage px-2 py-1 text-[9px] font-black tracking-widest text-primary uppercase">
                        {t(kind === "link" ? "share.kind.link" : kind === "image" ? "share.kind.image" : "share.kind.text")}
                      </span>
                    )}
                  </div>
                  {!initial?.url && !initial?.file && !initial?.text && (
                    <div className="mb-4 flex gap-2">
                      <label htmlFor="share-raw" className="sr-only">
                        {t("share.paste")}
                      </label>
                      <input
                        id="share-raw"
                        autoFocus
                        placeholder={t("share.paste")}
                        className="w-full rounded-2xl border border-line bg-canvas px-5 py-3.5 text-sm font-medium placeholder:text-muted/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:outline-none"
                        value={raw}
                        onChange={(e) => setRaw(e.target.value)}
                      />
                      <label className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-line bg-surface text-primary hover:bg-canvas" title={t("capture.menu.photo")}>
                        <ImageIcon className="size-4" aria-hidden />
                        <span className="sr-only">{t("capture.menu.photo")}</span>
                        <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  )}
                  {kind && (
                    <div className="rounded-4xl bg-canvas p-2">
                      <div className="overflow-hidden rounded-3xl bg-surface shadow-sm">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt="" className="h-36 w-full object-cover" />
                        ) : (
                          <div className="flex h-24 items-center justify-center bg-sage/30 text-primary">
                            <KindIcon className="size-7" aria-hidden />
                          </div>
                        )}
                        <div className="p-5">
                          <p className="line-clamp-2 font-bold break-words">{initial?.title ?? (url ? new URL(url).hostname.replace(/^www\./, "") : file ? file.name : raw.trim())}</p>
                          {url && <p className="mt-1 truncate text-[11px] text-muted">{url.replace(/^https?:\/\//, "")}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </section>

                {err && (
                  <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
                    {err}
                  </p>
                )}
                {mode === "error" && (
                  <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
                    {t("share.failed")}
                  </p>
                )}

                <div className="space-y-3">
                  <OptionRow Icon={Plus} title={t("share.action.new")} sub={t("share.new.sub")} disabled={!kind || busy} onClick={() => void saveNew()} />
                  <OptionRow
                    Icon={FolderPlus}
                    tone="coral"
                    title={t("share.action.existing")}
                    sub={t("share.existing.sub")}
                    disabled={!kind || busy}
                    expanded={mode === "existing"}
                    onClick={() => setMode((m) => (m === "existing" ? "choose" : "existing"))}
                  />
                  {mode === "existing" && (
                    <div className="space-y-2 rounded-3xl bg-canvas p-3">
                      <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
                        <input
                          type="search"
                          aria-label={t("share.search")}
                          placeholder={t("share.search")}
                          className="w-full rounded-2xl border border-line bg-surface py-3 pr-4 pl-10 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                        />
                      </div>
                      {matches.map((i) => (
                        <button
                          key={i.id}
                          disabled={busy}
                          onClick={() => void saveExisting(i.id)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 text-left text-sm font-bold hover:text-primary"
                        >
                          <span className="break-words">{ideaLabel(i, atts?.get(i.id))}</span>
                          <ChevronRight className="size-4 shrink-0 text-muted/50" aria-hidden />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <footer className="pb-safe border-t border-line/70 bg-canvas/50">
            <button onClick={onClose} className="w-full py-6 text-xs font-black tracking-[0.2em] text-muted uppercase hover:text-ink">
              {mode === "done" ? t("share.done") : t("action.cancel")}
            </button>
          </footer>
        </div>
      )}
    </dialog>
  );
}

function OptionRow({
  Icon,
  title,
  sub,
  onClick,
  disabled,
  tone = "teal",
  expanded,
}: {
  Icon: typeof Plus;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "teal" | "coral";
  expanded?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      className="group flex w-full items-center gap-5 rounded-4xl bg-canvas p-5 text-left transition-all hover:bg-sage/40 active:scale-[0.98] disabled:opacity-50"
    >
      <span className={cx("flex size-14 shrink-0 items-center justify-center rounded-3xl bg-surface shadow-sm", tone === "teal" ? "text-primary" : "text-coral-ink")}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black tracking-tight uppercase">{title}</span>
        <span className="mt-1 block text-xs text-muted">{sub}</span>
      </span>
      <ChevronRight className={cx("size-4 text-muted/40 transition-transform group-hover:text-primary", expanded && "rotate-90")} aria-hidden />
    </button>
  );
}
