"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, AudioLines, ExternalLink, ImagePlus, Link2, Plus, Trash2 } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { relative } from "@/lib/dates";
import { useCategories, useIdea, useOnline, useReminders } from "@/lib/hooks";
import {
  addAttachment,
  addPlatformPlan,
  deleteIdea,
  removeAttachment,
  removePlatformPlan,
  saveTranscript,
  setIdeaStatus,
  updateIdea,
  updatePlatformPlan,
  ValidationError,
} from "@/lib/repo";
import { PLATFORMS, type Attachment, type Idea, type IdeaStatus, type Platform, type PlatformPlan } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { TaskRow, UploadBadge, useAttachmentUrl } from "@/components/cards";
import { NotificationsButton } from "@/components/shell";
import { Button, Card, ConfirmDialog, cx, DemoBadge, EmptyState, Field, IconButton, inputClass, Sheet } from "@/components/ui";

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const idea = useIdea(id);
  const categories = useCategories();
  const reminders = useReminders();
  const { openTaskEditor, toast } = useApp();
  const atts = useLiveQuery(() => getDb().attachments.where("idea_id").equals(id).filter((a) => !a.deleted_at).sortBy("created_at"), [id]);
  const tasks = useLiveQuery(() => getDb().tasks.where("idea_id").equals(id).filter((x) => !x.deleted_at).toArray(), [id]);
  const plans = useLiveQuery(() => getDb().platform_plans.where("idea_id").equals(id).filter((p) => !p.deleted_at).toArray(), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  if (idea === undefined) return null;
  if (idea === null) {
    return (
      <EmptyState
        icon={<ArrowLeft className="size-5" />}
        title={t("ideas.empty_search")}
        action={
          <Link href="/ideas" className="font-semibold text-primary">
            {t("action.view_library")}
          </Link>
        }
      />
    );
  }

  const statuses: { value: IdeaStatus; key: CopyKey }[] = [
    { value: "new", key: "idea.status.new" },
    { value: "in_progress", key: "idea.status.in_progress" },
    { value: "completed", key: "idea.status.completed" },
  ];

  async function addPhoto(file: File | undefined) {
    if (!file) return;
    try {
      await addAttachment(idea!.id, { kind: "image", blob: file, file_name: file.name });
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      toast(t(key as CopyKey, limit ? { limit } : undefined));
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/ideas" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden /> {t("action.view_library")}
        </Link>
        <div className="flex items-center gap-2">
          {idea.demo && <DemoBadge />}
          <IconButton label={t("action.delete")} onClick={() => setConfirmDelete(true)} className="hover:text-danger">
            <Trash2 className="size-5" />
          </IconButton>
          <NotificationsButton />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-6 lg:col-span-8">
          <IdeaText key={idea.id} idea={idea} />

          <Card className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{t("idea.attachments")}</h2>
              <div className="flex gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-line px-4 text-sm font-semibold hover:bg-canvas">
                  <ImagePlus className="size-4" aria-hidden /> {t("capture.action.photo")}
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => void addPhoto(e.target.files?.[0])} />
                </label>
                <Button variant="secondary" onClick={() => setLinkOpen(true)}>
                  <Link2 className="size-4" aria-hidden /> {t("capture.action.link")}
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {atts?.map((a) => (
                <AttachmentView key={a.id} att={a} />
              ))}
            </div>
          </Card>

          <PlatformPlans ideaId={idea.id} plans={plans ?? []} />
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Card className="space-y-5 p-6">
            <Field label={t("idea.status.label")} hint={t("idea.status.manual_hint")}>
              {(fid) => (
                <select id={fid} className={inputClass} value={idea.status} onChange={(e) => void setIdeaStatus(idea.id, e.target.value as IdeaStatus)}>
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {t(s.key)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t("capture.category.label")}>
              {(fid) => (
                <select id={fid} className={inputClass} value={idea.category_id ?? ""} onChange={(e) => void updateIdea(idea.id, { category_id: e.target.value || null })}>
                  <option value="">—</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("idea.linked_tasks")}</h2>
              <Button variant="ghost" className="px-3" onClick={() => openTaskEditor({ ideaId: idea.id })}>
                <Plus className="size-4" aria-hidden /> {t("idea.action.add_task")}
              </Button>
            </div>
            {tasks && tasks.length === 0 ? (
              <p className="text-sm text-muted">{t("idea.no_tasks")}</p>
            ) : (
              <div className="space-y-3">
                {tasks?.map((task) => (
                  <TaskRow key={task.id} task={task} variant="inset" showDate reminder={reminders?.find((r) => r.task_id === task.id)} />
                ))}
              </div>
            )}
          </Card>
        </aside>
      </div>

      <AddLinkSheet open={linkOpen} onClose={() => setLinkOpen(false)} ideaId={idea.id} />
      <ConfirmDialog
        open={confirmDelete}
        title={t("idea.delete.title")}
        body={t("idea.delete.body")}
        confirmLabel={t("action.confirm_delete")}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteIdea(idea.id);
          toast(t("toast.deleted"));
          router.replace("/ideas");
        }}
      />
    </>
  );
}

function IdeaText({ idea }: { idea: Idea }) {
  const [title, setTitle] = useState(idea.title ?? "");
  const [body, setBody] = useState(idea.body ?? "");
  return (
    <Card className="p-6 sm:p-8">
      <label htmlFor="idea-title" className="sr-only">
        {t("capture.title.label")}
      </label>
      <input
        id="idea-title"
        value={title}
        placeholder={t("capture.title.label")}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== (idea.title ?? "") && void updateIdea(idea.id, { title })}
        className="w-full bg-transparent font-display text-2xl font-bold tracking-tight placeholder:text-muted/50 focus:outline-none lg:text-3xl"
      />
      <p className="mt-2 text-sm text-muted">{t("idea.updated", { when: relative(idea.updated_at) })}</p>
      <label htmlFor="idea-body" className="mt-6 mb-1.5 block text-sm font-semibold">
        {t("capture.body.label")}
      </label>
      <textarea
        id="idea-body"
        rows={6}
        value={body}
        placeholder={t("capture.body.placeholder")}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== (idea.body ?? "") && void updateIdea(idea.id, { body })}
        className={cx(inputClass, "min-h-36 resize-y leading-relaxed")}
      />
    </Card>
  );
}

function AddLinkSheet({ open, onClose, ideaId }: { open: boolean; onClose: () => void; ideaId: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("capture.action.link")}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button
            disabled={!url.trim()}
            onClick={async () => {
              try {
                await addAttachment(ideaId, { kind: "url", url });
                setUrl("");
                onClose();
              } catch {
                setError(t("capture.error.link"));
              }
            }}
          >
            {t("action.save")}
          </Button>
        </div>
      }
    >
      <Field label={t("capture.link.label")} error={error}>
        {(id) => <input id={id} type="url" className={inputClass} placeholder={t("capture.link.placeholder")} value={url} onChange={(e) => setUrl(e.target.value)} />}
      </Field>
    </Sheet>
  );
}

function AttachmentView({ att }: { att: Attachment }) {
  const url = useAttachmentUrl(att);
  return (
    <div className="rounded-tile border border-line p-4">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {att.kind === "image" && url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={att.note ?? att.file_name ?? t("idea.photo")} className="max-h-96 rounded-control object-contain" />
          )}
          {att.kind === "audio" && <AudioAttachment att={att} url={url} />}
          {att.kind === "url" && (
            <a href={att.external_url!} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex max-w-full items-center gap-2 font-semibold break-all text-primary hover:underline">
              <ExternalLink className="size-4 shrink-0" aria-hidden /> {att.external_url}
            </a>
          )}
          <div className="mt-2">
            <UploadBadge att={att} />
          </div>
        </div>
        <IconButton label={t("action.delete")} onClick={() => void removeAttachment(att.id)} className="-m-2 hover:text-danger">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}

/** On-demand transcription (VOICE-01): never automatic, consent first, original audio untouched. */
function AudioAttachment({ att, url }: { att: Attachment; url: string | null }) {
  const transcript = useLiveQuery(() => getDb().transcripts.where("attachment_id").equals(att.id).first(), [att.id]);
  const online = useOnline();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");

  async function transcribe() {
    setConsent(false);
    setError(null);
    if (!navigator.onLine) return setError(t("voice.offline"));
    setBusy(true);
    try {
      const file = await getDb().files.get(att.id);
      if (!file) throw new Error("missing");
      const fd = new FormData();
      fd.append("audio", file.blob, att.file_name ?? "audio.webm");
      fd.append("idempotency_key", att.id);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (res.status === 501) throw new Error("not_configured");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { text: string; language?: string };
      await saveTranscript(att.id, data.text, data.language ?? null);
    } catch (e) {
      setError(e instanceof Error && e.message === "not_configured" ? t("voice.not_configured") : t("voice.failed"));
    } finally {
      setBusy(false);
    }
  }

  const secs = Math.round((att.duration_ms ?? 0) / 1000);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-control bg-sage text-primary">
          <AudioLines className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">{t("idea.voice_note")}</p>
          {secs > 0 && <p className="text-xs text-muted">{`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}</p>}
        </div>
      </div>
      {url && <audio controls src={url} className="w-full" />}
      {transcript && !editing && (
        <div className="rounded-control bg-canvas p-4">
          <p className="mb-1 text-xs font-semibold text-muted">{t("voice.transcript")}</p>
          <p className="leading-relaxed whitespace-pre-wrap">{transcript.text}</p>
          <Button
            variant="ghost"
            className="mt-2 -ml-3 px-3"
            onClick={() => {
              setText(transcript.text);
              setEditing(true);
            }}
          >
            {t("voice.action.edit")}
          </Button>
        </div>
      )}
      {editing && (
        <div className="space-y-2">
          <textarea aria-label={t("voice.transcript")} rows={4} className={cx(inputClass, "resize-y")} value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              {t("action.cancel")}
            </Button>
            <Button
              onClick={async () => {
                await saveTranscript(att.id, text);
                setEditing(false);
              }}
            >
              {t("action.save")}
            </Button>
          </div>
        </div>
      )}
      {!transcript && (
        <Button variant="secondary" loading={busy} onClick={() => setConsent(true)} disabled={!online}>
          {busy ? t("voice.state.transcribing") : t("voice.action.transcribe")}
        </Button>
      )}
      {!online && !transcript && <p className="text-xs text-muted">{t("voice.offline")}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={consent}
        title={t("voice.action.transcribe")}
        body={t("voice.consent")}
        confirmLabel={t("voice.action.transcribe")}
        onClose={() => setConsent(false)}
        onConfirm={() => void transcribe()}
      />
    </div>
  );
}

function PlatformPlans({ ideaId, plans }: { ideaId: string; plans: PlatformPlan[] }) {
  const used = new Set(plans.map((p) => p.platform));
  const [adding, setAdding] = useState<Platform | "">("");
  return (
    <Card className="p-6 sm:p-8">
      <details open={plans.length > 0} className="group">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xl font-bold font-display">
          {t("idea.platforms.title")}
          <Plus className="size-5 text-muted transition-transform group-open:rotate-45" aria-hidden />
        </summary>
        <div className="mt-4 space-y-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-tile border border-line p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold">{PLATFORMS.find((x) => x.id === p.platform)?.label}</p>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={t("idea.status.label")}
                    className={cx(inputClass, "w-auto py-1.5 text-sm")}
                    value={p.publish_state}
                    onChange={(e) => void updatePlatformPlan(p.id, { publish_state: e.target.value as PlatformPlan["publish_state"] })}
                  >
                    <option value="draft">{t("idea.platforms.state.draft")}</option>
                    <option value="ready">{t("idea.platforms.state.ready")}</option>
                    <option value="published">{t("idea.platforms.state.published")}</option>
                  </select>
                  <IconButton label={t("action.delete")} onClick={() => void removePlatformPlan(p.id)} className="hover:text-danger">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("idea.platforms.notes")}>
                  {(id) => (
                    <textarea
                      id={id}
                      rows={2}
                      defaultValue={p.notes ?? ""}
                      onBlur={(e) => e.target.value !== (p.notes ?? "") && void updatePlatformPlan(p.id, { notes: e.target.value || null })}
                      className={cx(inputClass, "resize-y text-sm")}
                    />
                  )}
                </Field>
                <Field label={t("idea.platforms.target")}>
                  {(id) => (
                    <input
                      id={id}
                      type="date"
                      defaultValue={p.target_at?.slice(0, 10) ?? ""}
                      onChange={(e) => void updatePlatformPlan(p.id, { target_at: e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null })}
                      className={cx(inputClass, "text-sm")}
                    />
                  )}
                </Field>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <select aria-label={t("idea.platforms.add")} className={cx(inputClass, "w-auto")} value={adding} onChange={(e) => setAdding(e.target.value as Platform)}>
              <option value="">{t("idea.platforms.add")}</option>
              {PLATFORMS.filter((x) => !used.has(x.id)).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              disabled={!adding}
              onClick={async () => {
                if (!adding) return;
                await addPlatformPlan(ideaId, adding);
                setAdding("");
              }}
            >
              <Plus className="size-4" aria-hidden /> {t("idea.platforms.add")}
            </Button>
          </div>
        </div>
      </details>
    </Card>
  );
}
