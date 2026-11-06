"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ImagePlus, Search } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { ideaLabel, useAttachments, useIdeas } from "@/lib/hooks";
import { addAttachment, createIdea, updateIdea, normalizeUrl, uid, ValidationError, type NewAttachmentInput } from "@/lib/repo";
import { getDb } from "@/lib/db";
import { TopBar } from "@/components/shell";
import { Button, Card, cx, Field, inputClass, Segmented } from "@/components/ui";

/**
 * Share intake. On mobile the native OS share sheet is the entry point (React Native build);
 * on the web this page is the in-app paste/drop import (PRD §15.6) — not an imitation OS sheet.
 */
export default function ImportPage() {
  const ideas = useIdeas();
  const atts = useAttachments();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<"new" | "existing">("new");
  const [q, setQ] = useState("");
  const [existingId, setExistingId] = useState("");
  const [msg, setMsg] = useState<{ text: string; href?: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (ideas ?? []).filter((i) => !n || ideaLabel(i, atts?.get(i.id)).toLowerCase().includes(n) || (i.body ?? "").toLowerCase().includes(n)).slice(0, 8);
  }, [ideas, atts, q]);

  function payload(): NewAttachmentInput[] {
    const out: NewAttachmentInput[] = [];
    if (file) out.push({ kind: "image", blob: file, file_name: file.name });
    const url = normalizeUrl(text);
    if (url) out.push({ kind: "url", url });
    return out;
  }

  async function submit() {
    setMsg(null);
    setBusy(true);
    try {
      const url = normalizeUrl(text);
      const atts = payload();
      if (target === "new") {
        const idea = await createIdea({ clientId: uid(), body: url ? null : text, attachments: atts });
        setMsg({ text: t("share.done.new"), href: `/ideas/${idea.id}` });
      } else {
        if (!existingId) return;
        for (const a of atts) await addAttachment(existingId, a);
        if (!url && text.trim()) {
          const idea = await getDb().ideas.get(existingId);
          await updateIdea(existingId, { body: [idea?.body, text.trim()].filter(Boolean).join("\n\n") });
        }
        const idea = ideas?.find((i) => i.id === existingId);
        setMsg({ text: t("share.done.existing", { title: idea ? ideaLabel(idea) : "" }), href: `/ideas/${existingId}` });
      }
      setText("");
      setFile(null);
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      setMsg({ text: t(key as CopyKey, limit ? { limit } : undefined), error: true });
    } finally {
      setBusy(false);
    }
  }

  const hasContent = Boolean(text.trim() || file);

  return (
    <>
      <TopBar title={t("share.title")} subtitle={t("share.subtitle")} />
      <div className="grid max-w-3xl gap-6">
        <Card className="space-y-5 p-6 sm:p-8">
          <Field label={t("share.paste.label")}>
            {(id) => <textarea id={id} rows={3} className={cx(inputClass, "resize-y")} placeholder={t("capture.link.placeholder")} value={text} onChange={(e) => setText(e.target.value)} />}
          </Field>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files[0];
              if (f?.type.startsWith("image/")) setFile(f);
              else setMsg({ text: t("capture.error.file_type"), error: true });
            }}
            className={cx("flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-tile border-2 border-dashed p-4 text-sm text-muted", drag ? "border-primary bg-sage/40" : "border-line")}
          >
            <ImagePlus className="size-6 text-primary" aria-hidden />
            {file ? file.name : t("capture.photo.drop")}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </Card>

        <Card className="space-y-5 p-6 sm:p-8">
          <Segmented<"new" | "existing">
            label={t("share.title")}
            value={target}
            onChange={setTarget}
            options={[
              { value: "new", label: t("share.action.new") },
              { value: "existing", label: t("share.action.existing") },
            ]}
          />
          {target === "existing" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input type="search" aria-label={t("share.search.placeholder")} placeholder={t("share.search.placeholder")} className={cx(inputClass, "pl-10")} value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div role="radiogroup" aria-label={t("share.action.existing")} className="space-y-2">
                {filtered.map((i) => (
                  <label key={i.id} className={cx("flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-4 py-2", existingId === i.id ? "border-primary bg-sage/30" : "border-line")}>
                    <input type="radio" name="existing" className="accent-primary" checked={existingId === i.id} onChange={() => setExistingId(i.id)} />
                    <span className="font-medium break-words">{ideaLabel(i, atts?.get(i.id))}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {msg && (
            <p role={msg.error ? "alert" : "status"} className={cx("rounded-control px-3 py-2 text-sm", msg.error ? "bg-danger-tint text-danger" : "bg-sage text-primary")}>
              {msg.text}{" "}
              {msg.href && (
                <Link href={msg.href} className="font-semibold underline">
                  {t("action.open")}
                </Link>
              )}
            </p>
          )}
          <Button onClick={submit} loading={busy} disabled={!hasContent || (target === "existing" && !existingId)} className="w-full sm:w-auto">
            {target === "new" ? t("share.action.new") : t("share.action.existing")}
          </Button>
        </Card>
      </div>
    </>
  );
}
