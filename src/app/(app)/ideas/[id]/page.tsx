"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Camera, ChevronDown, ChevronRight, Expand, Link2, Mic, MoreVertical, Pencil, Plus, Share2, Trash2, X } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { relative } from "@/lib/dates";
import { useCategories, useIdea, useProfile } from "@/lib/hooks";
import { addAttachment, addPlatformPlan, deleteIdea, removeAttachment, setIdeaStatus, setTaskCompleted, updateIdea, ValidationError } from "@/lib/repo";
import { PLATFORMS, type Attachment, type Idea, type IdeaStatus, type Platform, type PlatformPlan, type Task } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { useAttachmentUrl } from "@/components/cards";
import { coverOf, STATUS_KEY } from "@/components/library-card";
import { PLAN_STATE_KEY, PlatformIcon, platformLabel } from "@/components/platform-icon";
import { ConfirmDialog, cx, DemoBadge, EmptyState, Sheet } from "@/components/ui";

/** Idea_Detail */
export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const idea = useIdea(id);
  const { toast } = useApp();
  const atts = useLiveQuery(() => getDb().attachments.where("idea_id").equals(id).filter((a) => !a.deleted_at).sortBy("created_at"), [id]);
  const tasks = useLiveQuery(() => getDb().tasks.where("idea_id").equals(id).filter((x) => !x.deleted_at).sortBy("created_at"), [id]);
  const plans = useLiveQuery(() => getDb().platform_plans.where("idea_id").equals(id).filter((p) => !p.deleted_at).sortBy("created_at"), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menu, setMenu] = useState(false);

  if (idea === undefined) return null;
  if (idea === null) {
    return (
      <div className="p-8 lg:p-12">
        <EmptyState icon={<ArrowLeft className="size-5" />} title={t("ideas.empty_search")} action={<Link href="/ideas" className="font-bold text-primary">{t("detail.back")}</Link>} />
      </div>
    );
  }

  const a = atts ?? [];
  async function share() {
    const text = [idea!.title, idea!.body, ...a.filter((x) => x.kind === "url").map((x) => x.external_url)].filter(Boolean).join("\n\n");
    try {
      if (navigator.share) await navigator.share({ title: idea!.title ?? undefined, text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t("detail.copied"));
      }
    } catch {
      /* user cancelled */
    }
  }
  const remove = async () => {
    await deleteIdea(idea!.id);
    toast(t("toast.deleted"));
    router.replace("/ideas");
  };

  return (
    <div className="lg:flex lg:min-h-dvh">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 -mx-5 -mt-6 mb-8 flex items-center justify-between bg-surface px-6 pt-12 pb-6 shadow-sm shadow-ink/5 sm:-mx-8 lg:hidden">
        <Link href="/ideas" aria-label={t("detail.back")} title={t("detail.back")} className="flex size-11 items-center justify-center rounded-full bg-canvas text-muted">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex gap-2">
          <button onClick={() => void share()} aria-label={t("detail.share")} title={t("detail.share")} className="flex size-11 items-center justify-center rounded-full bg-canvas text-muted">
            <Share2 className="size-4" />
          </button>
          <button onClick={() => setMenu(true)} aria-label={t("detail.more")} title={t("detail.more")} className="flex size-11 items-center justify-center rounded-full bg-canvas text-muted">
            <MoreVertical className="size-4" />
          </button>
        </div>
      </header>

      {/* Main column */}
      <div className="min-w-0 flex-1 lg:p-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 hidden items-center justify-between lg:flex">
            <Link href="/ideas" className="group flex items-center gap-2 text-sm font-bold text-muted hover:text-primary">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden /> {t("detail.back")}
            </Link>
            <div className="flex items-center gap-3">
              {idea.demo && <DemoBadge />}
              <Link href={`/ideas/${idea.id}/edit`} aria-label={t("edit.title")} title={t("edit.title")} className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm hover:text-primary">
                <Pencil className="size-4" />
              </Link>
              <button onClick={() => void share()} aria-label={t("detail.share")} title={t("detail.share")} className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm hover:text-primary">
                <Share2 className="size-4" />
              </button>
              <button onClick={() => setConfirmDelete(true)} aria-label={t("action.delete")} title={t("action.delete")} className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-sm hover:text-danger">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <Hero idea={idea} atts={a} />

          <MetaRow idea={idea} />
          <IdeaText key={idea.id} idea={idea} />

          {/* Mobile: linked tasks card sits before attachments */}
          <div className="mb-12 lg:hidden">
            <LinkedTasks ideaId={idea.id} tasks={tasks ?? []} card />
          </div>

          <Attachments idea={idea} atts={a} />
          <Links atts={a} />

          <div className="mt-12 lg:hidden">
            <Plans ideaId={idea.id} plans={plans ?? []} />
          </div>
        </div>
      </div>

      {/* Desktop side panel */}
      <aside className="hidden w-96 shrink-0 border-l border-line bg-surface/50 p-10 backdrop-blur-md lg:block">
        <div className="sticky top-10 space-y-12">
          <Configuration idea={idea} />
          <LinkedTasks ideaId={idea.id} tasks={tasks ?? []} />
          <Plans ideaId={idea.id} plans={plans ?? []} />
        </div>
      </aside>

      <Sheet open={menu} onClose={() => setMenu(false)} title={t("detail.more")} size="sm">
        <div className="space-y-2 pb-6">
          <Link href={`/ideas/${idea.id}/edit`} className="flex min-h-12 items-center gap-3 rounded-2xl bg-canvas px-5 text-sm font-bold">
            <Pencil className="size-4 text-primary" aria-hidden /> {t("edit.title")}
          </Link>
          <button
            onClick={() => {
              setMenu(false);
              setConfirmDelete(true);
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-danger-tint px-5 text-sm font-bold text-danger"
          >
            <Trash2 className="size-4" aria-hidden /> {t("action.delete")}
          </button>
        </div>
      </Sheet>
      <ConfirmDialog open={confirmDelete} title={t("idea.delete.title")} body={t("idea.delete.body")} confirmLabel={t("action.confirm_delete")} onClose={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
    </div>
  );
}

function Hero({ idea, atts }: { idea: Idea; atts: Attachment[] }) {
  const cover = coverOf(idea, atts);
  const url = useAttachmentUrl(cover);
  const [pick, setPick] = useState(false);
  const images = atts.filter((x) => x.kind === "image");
  const { toast } = useApp();

  async function upload(f: File | undefined) {
    if (!f) return;
    try {
      const att = await addAttachment(idea.id, { kind: "image", blob: f, file_name: f.name });
      await updateIdea(idea.id, { cover_attachment_id: att.id });
      setPick(false);
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      toast(t(key as CopyKey, limit ? { limit } : undefined));
    }
  }

  return (
    <>
      <div className="group relative mb-10 h-64 overflow-hidden rounded-4xl bg-sage/30 shadow-sm lg:h-80">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-primary/30">
            <Camera className="size-10" aria-hidden />
          </div>
        )}
        <button
          onClick={() => setPick(true)}
          aria-label={t("detail.change_header")}
          className="absolute right-5 bottom-5 flex size-12 items-center justify-center rounded-2xl bg-surface/90 text-ink shadow-md backdrop-blur transition-all lg:size-auto lg:translate-y-2 lg:rounded-xl lg:px-4 lg:py-2 lg:text-xs lg:font-bold lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
        >
          <Camera className="size-4 lg:hidden" aria-hidden />
          <span className="hidden lg:inline">{t("detail.change_header")}</span>
        </button>
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} title={t("detail.change_header")} size="md">
        <div className="grid grid-cols-3 gap-3 pb-6">
          {images.map((img) => (
            <CoverOption key={img.id} att={img} selected={cover?.id === img.id} onPick={() => void updateIdea(idea.id, { cover_attachment_id: img.id }).then(() => setPick(false))} />
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage text-primary hover:bg-sage/20">
            <Plus className="size-5" aria-hidden />
            <span className="text-[10px] font-black tracking-widest uppercase">{t("detail.add")}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
          </label>
        </div>
      </Sheet>
    </>
  );
}

function CoverOption({ att, selected, onPick }: { att: Attachment; selected: boolean; onPick: () => void }) {
  const url = useAttachmentUrl(att);
  return (
    <button onClick={onPick} aria-pressed={selected} className={cx("aspect-square overflow-hidden rounded-2xl", selected && "ring-4 ring-primary")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={att.file_name ?? ""} className="size-full object-cover" />}
    </button>
  );
}

function MetaRow({ idea }: { idea: Idea }) {
  const categories = useCategories();
  const category = categories?.find((c) => c.id === idea.category_id);
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      {category && <span className="rounded-lg bg-sage px-3 py-1.5 text-[10px] font-black tracking-widest text-primary uppercase">{category.name}</span>}
      {/* Mobile: status as a chip-styled select; desktop shows it in the side panel */}
      <label className="relative lg:hidden">
        <span className="sr-only">{t("idea.status.label")}</span>
        <select
          value={idea.status}
          onChange={(e) => void setIdeaStatus(idea.id, e.target.value as IdeaStatus)}
          className="min-h-9 appearance-none rounded-lg border border-line bg-surface py-1.5 pr-8 pl-3 text-[10px] font-black tracking-widest uppercase shadow-sm"
        >
          {(Object.keys(STATUS_KEY) as IdeaStatus[]).map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEY[s])}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-muted" aria-hidden />
      </label>
      <span className="text-[10px] font-bold tracking-widest text-muted uppercase">{t("detail.last_edited", { when: relative(idea.updated_at).toLowerCase() })}</span>
      {idea.demo && (
        <span className="lg:hidden">
          <DemoBadge />
        </span>
      )}
    </div>
  );
}

function IdeaText({ idea }: { idea: Idea }) {
  const [title, setTitle] = useState(idea.title ?? "");
  const [body, setBody] = useState(idea.body ?? "");
  return (
    <div className="mb-12">
      <label htmlFor="idea-title" className="sr-only">
        {t("edit.idea_title")}
      </label>
      <textarea
        id="idea-title"
        rows={1}
        value={title}
        placeholder={t("capture.title.label")}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title !== (idea.title ?? "") && void updateIdea(idea.id, { title })}
        className="mb-6 field-sizing-content w-full resize-none bg-transparent text-[2rem] leading-tight font-black tracking-tight placeholder:text-muted/30 focus:outline-none lg:text-4xl"
      />
      <label htmlFor="idea-body" className="sr-only">
        {t("edit.notes")}
      </label>
      <textarea
        id="idea-body"
        value={body}
        placeholder={t("detail.notes.placeholder")}
        onChange={(e) => setBody(e.target.value)}
        onBlur={() => body !== (idea.body ?? "") && void updateIdea(idea.id, { body })}
        className="field-sizing-content min-h-[120px] w-full resize-none bg-transparent text-[15px] leading-relaxed font-medium text-muted italic placeholder:text-muted/30 focus:outline-none lg:text-lg lg:not-italic"
      />
    </div>
  );
}

function Attachments({ idea, atts }: { idea: Idea; atts: Attachment[] }) {
  const media = atts.filter((x) => x.kind !== "url");
  const [all, setAll] = useState(false);
  const [view, setView] = useState<Attachment | null>(null);
  const { toast } = useApp();
  const shown = all ? media : media.slice(0, 4);

  async function add(f: File | undefined) {
    if (!f) return;
    try {
      await addAttachment(idea.id, { kind: "image", blob: f, file_name: f.name });
    } catch (e) {
      const [key, limit] = (e instanceof ValidationError ? e.message : "error.generic").split(":");
      toast(t(key as CopyKey, limit ? { limit } : undefined));
    }
  }

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center justify-between px-2 lg:px-0">
        <h2 className="text-xl font-black tracking-tight uppercase lg:font-bold lg:normal-case">{t("idea.attachments")}</h2>
        <div className="flex items-center gap-5">
          {media.length > 4 && (
            <button onClick={() => setAll((x) => !x)} className="text-[10px] font-black tracking-widest text-primary uppercase hover:underline">
              {t("detail.see_all")}
            </button>
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[10px] font-black tracking-widest text-primary uppercase hover:underline lg:text-sm lg:font-bold lg:normal-case lg:tracking-normal">
            <Plus className="size-3.5" aria-hidden /> {t("detail.add")}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void add(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      {media.length === 0 ? (
        <p className="px-2 text-sm text-muted lg:px-0">—</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          {shown.map((att) => (att.kind === "image" ? <ImageTile key={att.id} att={att} onExpand={() => setView(att)} /> : <AudioTile key={att.id} idea={idea} att={att} />))}
        </div>
      )}
      <ImageViewer att={view} onClose={() => setView(null)} />
    </section>
  );
}

function ImageTile({ att, onExpand }: { att: Attachment; onExpand: () => void }) {
  const url = useAttachmentUrl(att);
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-3xl bg-sage/20 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={att.note ?? att.file_name ?? t("idea.photo")} className="size-full object-cover" />}
      <div className="absolute inset-0 flex items-end justify-end gap-2 p-3 transition-opacity lg:items-center lg:justify-center lg:gap-4 lg:bg-ink/10 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <button onClick={onExpand} aria-label={t("idea.photo")} title={t("idea.photo")} className="flex size-10 items-center justify-center rounded-full bg-surface text-primary shadow-lg">
          <Expand className="size-4" />
        </button>
        <button onClick={() => setConfirm(true)} aria-label={t("media.remove")} title={t("media.remove")} className="flex size-10 items-center justify-center rounded-full bg-surface text-danger shadow-lg">
          <Trash2 className="size-4" />
        </button>
      </div>
      <ConfirmDialog open={confirm} title={t("media.remove")} body={att.file_name ?? t("idea.photo")} confirmLabel={t("action.delete")} onClose={() => setConfirm(false)} onConfirm={() => void removeAttachment(att.id)} />
    </div>
  );
}

function ImageViewer({ att, onClose }: { att: Attachment | null; onClose: () => void }) {
  const url = useAttachmentUrl(att ?? undefined);
  return (
    <Sheet open={Boolean(att)} onClose={onClose} title={t("idea.photo")} size="lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={att?.file_name ?? ""} className="mx-auto max-h-[70dvh] rounded-2xl object-contain pb-6" />}
    </Sheet>
  );
}

function AudioTile({ idea, att }: { idea: Idea; att: Attachment }) {
  const secs = Math.round((att.duration_ms ?? 0) / 1000);
  const dur = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  const href = `/ideas/${idea.id}/voice/${att.id}`;
  return (
    <div className="group flex flex-col items-center justify-center gap-4 rounded-3xl border border-line bg-surface p-6 transition-all hover:border-sage">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-sage/30 text-primary transition-transform group-hover:scale-110 lg:size-16">
        <Mic className="size-6" aria-hidden />
      </span>
      <div className="w-full text-center">
        <p className="truncate text-sm font-bold uppercase lg:normal-case">{idea.title ?? t("idea.voice_note")}</p>
        <p className="mt-1 text-[10px] font-bold tracking-wide text-muted uppercase">
          {dur} • {t("detail.audio")}
        </p>
      </div>
      <div className="flex w-full gap-2">
        <Link href={href} className="flex min-h-9 flex-1 items-center justify-center rounded-xl bg-canvas text-[10px] font-black tracking-widest text-primary uppercase hover:bg-sage">
          {t("detail.play")}
        </Link>
        <Link href={href} className="flex min-h-9 flex-1 items-center justify-center rounded-xl bg-primary text-[10px] font-black tracking-widest text-white uppercase hover:opacity-90">
          {t("voice.action.transcribe")}
        </Link>
      </div>
    </div>
  );
}

function Links({ atts }: { atts: Attachment[] }) {
  const links = atts.filter((x) => x.kind === "url");
  if (!links.length) return null;
  return (
    <section>
      <h2 className="mb-6 px-2 text-xl font-black tracking-tight uppercase lg:px-0 lg:font-bold lg:normal-case">{t("detail.links")}</h2>
      <div className="space-y-4">
        {links.map((l) => {
          const host = (() => {
            try {
              return new URL(l.external_url!).hostname.replace(/^www\./, "");
            } catch {
              return l.external_url;
            }
          })();
          return (
            <div key={l.id} className="group relative flex gap-4 rounded-3xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-primary/20">
              <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-sage/30 text-primary lg:size-24">
                <Link2 className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 py-1">
                <a href={l.external_url!} target="_blank" rel="noopener noreferrer nofollow" className="font-bold break-words group-hover:text-primary after:absolute after:inset-0">
                  {host}
                </a>
                {l.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted">{l.note}</p>}
                <p className="mt-3 flex items-center gap-2 text-[10px] font-bold tracking-widest break-all text-muted uppercase">
                  <Link2 className="size-3 shrink-0" aria-hidden /> {l.external_url!.replace(/^https?:\/\//, "")}
                </p>
              </div>
              <button
                onClick={() => void removeAttachment(l.id)}
                aria-label={t("media.remove")}
                title={t("media.remove")}
                className="relative z-10 flex size-9 items-center justify-center self-start rounded-full text-muted hover:bg-danger-tint hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Configuration({ idea }: { idea: Idea }) {
  const categories = useCategories();
  return (
    <section>
      <h2 className="mb-6 text-xs font-black tracking-[0.2em] text-muted uppercase">{t("detail.config")}</h2>
      <div className="space-y-6">
        <div>
          <label htmlFor="cfg-status" className="mb-2 block text-[10px] font-black tracking-widest text-muted uppercase">
            {t("idea.status.label")}
          </label>
          <div className="relative">
            <select
              id="cfg-status"
              value={idea.status}
              onChange={(e) => void setIdeaStatus(idea.id, e.target.value as IdeaStatus)}
              className="w-full appearance-none rounded-2xl border border-line bg-surface px-4 py-3.5 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-primary/10"
            >
              {(Object.keys(STATUS_KEY) as IdeaStatus[]).map((s) => (
                <option key={s} value={s}>
                  {t(STATUS_KEY[s])}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
          </div>
          <p className="mt-2 text-[11px] text-muted">{t("idea.status.manual_hint")}</p>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-black tracking-widest text-muted uppercase">{t("capture.category.label")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {categories?.map((c) => (
              <button
                key={c.id}
                aria-pressed={idea.category_id === c.id}
                onClick={() => void updateIdea(idea.id, { category_id: idea.category_id === c.id ? null : c.id })}
                className={cx("min-h-9 rounded-xl px-4 text-xs font-bold", idea.category_id === c.id ? "border border-primary/10 bg-sage text-primary" : "border border-line text-muted hover:text-ink")}
              >
                {c.name}
              </button>
            ))}
            <Link href={`/ideas/${idea.id}/edit`} aria-label={t("edit.new_category")} title={t("edit.new_category")} className="flex size-9 items-center justify-center rounded-xl border border-line text-muted hover:text-primary">
              <Plus className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function LinkedTasks({ ideaId, tasks, card }: { ideaId: string; tasks: Task[]; card?: boolean }) {
  const { openTaskEditor } = useApp();
  const open = tasks.filter((x) => !x.is_completed).length;
  return (
    <section className={cx(card && "rounded-4xl border border-line bg-surface p-6 shadow-sm")}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className={cx("font-black uppercase", card ? "text-sm tracking-[0.15em]" : "text-xs tracking-[0.2em] text-muted")}>{t("idea.linked_tasks")}</h2>
        <span className="rounded-lg bg-sage px-2.5 py-1 text-[10px] font-black text-primary">{open}</span>
      </div>
      <div className="mb-6 space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className={cx("flex items-center gap-3 rounded-2xl border p-4", card ? "border-transparent bg-canvas" : "border-line/50 bg-surface shadow-sm")}>
            <button
              role="checkbox"
              aria-checked={task.is_completed}
              aria-label={task.is_completed ? t("task.action.incomplete") : t("task.action.complete")}
              onClick={() => void setTaskCompleted(task.id, !task.is_completed)}
              className="-m-2 flex size-11 shrink-0 items-center justify-center"
            >
              <span className={cx("flex size-6 items-center justify-center rounded-lg border-2", task.is_completed ? "border-primary bg-primary text-white" : "border-sage bg-surface")}>
                {task.is_completed && <span className="text-[10px]">✓</span>}
              </span>
            </button>
            <button onClick={() => openTaskEditor({ task })} className={cx("flex-1 text-left text-sm font-bold break-words", task.is_completed && "text-muted line-through")}>
              {task.title}
            </button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted">{t("idea.no_tasks")}</p>}
      </div>
      <button
        onClick={() => openTaskEditor({ ideaId })}
        className={cx(
          "flex w-full items-center justify-center gap-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98]",
          card ? "min-h-14 rounded-3xl text-xs font-black tracking-[0.2em] uppercase" : "min-h-12 text-sm font-bold",
        )}
      >
        {!card && <Plus className="size-3.5" aria-hidden />} {t("idea.action.add_task")}
      </button>
    </section>
  );
}

function Plans({ ideaId, plans }: { ideaId: string; plans: PlatformPlan[] }) {
  const profile = useProfile();
  const [open, setOpen] = useState(true);
  const used = new Set(plans.map((p) => p.platform));
  const suggestions = (profile?.preferred_platforms?.length ? profile.preferred_platforms : (["tiktok", "instagram"] as Platform[])).filter((p) => !used.has(p));
  return (
    <section>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mb-6 flex w-full items-center justify-between px-2 lg:px-0">
        <h2 className="text-xl font-black tracking-tight uppercase lg:text-xs lg:tracking-[0.2em] lg:text-muted">{t("idea.platforms.title")}</h2>
        <ChevronDown className={cx("size-3.5 text-muted transition-transform", !open && "-rotate-90")} aria-hidden />
      </button>
      {open && (
        <div className="space-y-4">
          {plans.map((p) => (
            <Link
              key={p.id}
              href={`/ideas/${ideaId}/plans/${p.id}`}
              className="flex items-center justify-between rounded-4xl border border-line/50 bg-surface p-5 shadow-sm transition-colors hover:bg-sage/10 lg:rounded-2xl lg:bg-canvas lg:p-4 lg:shadow-none"
            >
              <span className="flex items-center gap-4 lg:gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-canvas text-primary lg:size-auto lg:bg-transparent">
                  <PlatformIcon platform={p.platform} />
                </span>
                <span>
                  <span className="block text-sm font-bold uppercase lg:normal-case">{platformLabel(p.platform)}</span>
                  <span className="block text-[10px] font-black tracking-widest text-muted uppercase">{t(PLAN_STATE_KEY[p.publish_state])}</span>
                </span>
              </span>
              <ChevronRight className="size-4 text-muted" aria-hidden />
            </Link>
          ))}
          {suggestions.map((p) => (
            <button
              key={p}
              onClick={() => void addPlatformPlan(ideaId, p)}
              className="flex w-full items-center justify-between rounded-2xl border border-dashed border-line p-4 text-muted transition-colors hover:border-primary/30 hover:text-primary"
            >
              <span className="flex items-center gap-3 text-sm font-bold">
                <PlatformIcon platform={p} /> {PLATFORMS.find((x) => x.id === p)?.label}
              </span>
              <Plus className="size-3.5" aria-hidden />
              <span className="sr-only">{t("idea.platforms.add")}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
