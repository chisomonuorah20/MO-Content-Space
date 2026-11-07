"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileAudio, Image as ImageIcon, Link2, Mic, MoreVertical, StickyNote } from "lucide-react";
import { format, parseISO } from "date-fns";
import { t, type CopyKey } from "@/lib/copy";
import { relative } from "@/lib/dates";
import { ideaLabel } from "@/lib/hooks";
import { deleteIdea, setIdeaStatus } from "@/lib/repo";
import type { Attachment, Category, Idea, IdeaStatus } from "@/lib/types";
import { useAttachmentUrl } from "./cards";
import { ConfirmDialog, cx, DemoBadge } from "./ui";

export const STATUS_KEY: Record<IdeaStatus, CopyKey> = { new: "idea.status.new", in_progress: "idea.status.in_progress", completed: "idea.status.completed" };

/** Status chip styling from the designs (coral text darkened for contrast). */
export function StatusTag({ status, className }: { status: IdeaStatus; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex rounded-md px-2.5 py-1 text-[9px] font-black tracking-widest uppercase shadow-sm",
        status === "in_progress" && "bg-sage text-primary",
        status === "new" && "bg-canvas text-muted",
        status === "completed" && "bg-coral text-coral-ink",
        className,
      )}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}

export function coverOf(idea: Idea, atts: Attachment[]) {
  return atts.find((a) => a.id === idea.cover_attachment_id && a.kind === "image") ?? atts.find((a) => a.kind === "image");
}

function dateLabel(iso: string) {
  const diff = Date.now() - parseISO(iso).getTime();
  return diff < 24 * 3600_000 ? t("library.updated", { when: relative(iso).toLowerCase() }) : diff < 48 * 3600_000 ? relative(iso) : format(parseISO(iso), "MMM d, yyyy");
}

/** Ideas_Library card. */
export function LibraryCard({ idea, atts, transcript, category }: { idea: Idea; atts: Attachment[]; transcript?: string; category?: Category }) {
  const cover = coverOf(idea, atts);
  const url = useAttachmentUrl(cover);
  const audio = atts.find((a) => a.kind === "audio");
  const link = atts.find((a) => a.kind === "url");
  const kinds = new Set(atts.map((a) => a.kind));
  const preview = idea.title ? idea.body : null;
  const description = preview ?? (transcript ? t("library.transcribed", { text: transcript }) : link && idea.title ? link.external_url : null);

  const header = cover ? (
    url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="size-full object-cover" />
    ) : (
      <div className="size-full bg-sage/30" />
    )
  ) : audio ? (
    <div className="flex size-full items-center gap-3 bg-sage/10 px-8">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-surface text-primary shadow-sm">
        <Mic className="size-5" aria-hidden />
      </span>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[3, 6, 4, 5].map((h, i) => (
          <span key={i} className={cx("w-1 rounded-full", i % 2 ? "bg-primary" : "bg-primary/40")} style={{ height: h * 4 }} />
        ))}
      </span>
    </div>
  ) : (
    <div className="flex size-full items-center bg-canvas px-8 text-primary/50">{link ? <Link2 className="size-8" aria-hidden /> : <StickyNote className="size-8" aria-hidden />}</div>
  );

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-4xl border border-line bg-surface shadow-sm transition-all hover:border-primary/20 hover:shadow-raised">
      <div className={cx("relative", cover ? "h-48 lg:h-36" : "h-32 lg:h-36")}>
        {header}
        <div className="absolute top-4 right-4 flex gap-2" aria-hidden>
          {kinds.has("image") && <KindBadge Icon={ImageIcon} />}
          {kinds.has("audio") && <KindBadge Icon={cover ? Mic : FileAudio} />}
          {kinds.has("url") && <KindBadge Icon={Link2} />}
        </div>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <StatusTag status={idea.status} />
          {idea.demo && <DemoBadge />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        {category && <p className="mb-2 text-[9px] font-black tracking-widest text-primary uppercase">{category.name}</p>}
        <h3 className="mb-2 text-lg leading-tight font-bold break-words lg:text-base">
          <Link href={`/ideas/${idea.id}`} className="after:absolute after:inset-0 focus:outline-none group-hover:text-primary">
            {ideaLabel(idea, atts)}
          </Link>
        </h3>
        {description && <p className="mb-4 line-clamp-2 text-xs leading-relaxed font-medium break-words text-muted">{description}</p>}
        <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-4">
          <span className="text-[9px] font-black tracking-widest text-muted uppercase">{dateLabel(idea.updated_at)}</span>
          <CardMenu idea={idea} />
        </div>
      </div>
    </article>
  );
}

function KindBadge({ Icon }: { Icon: typeof Mic }) {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg bg-surface/90 text-primary shadow-sm backdrop-blur">
      <Icon className="size-3.5" />
    </span>
  );
}

function CardMenu({ idea }: { idea: Idea }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative z-10">
      <button
        aria-label={t("library.menu")}
        title={t("library.menu")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className="-m-2 flex size-11 items-center justify-center rounded-full text-primary hover:bg-canvas"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 bottom-12 w-52 rounded-2xl border border-line bg-surface p-2 shadow-raised">
          {(Object.keys(STATUS_KEY) as IdeaStatus[]).map((s) => (
            <button
              key={s}
              role="menuitemradio"
              aria-checked={idea.status === s}
              onClick={() => {
                void setIdeaStatus(idea.id, s);
                setOpen(false);
              }}
              className={cx("flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold hover:bg-canvas", idea.status === s && "text-primary")}
            >
              {t(STATUS_KEY[s])}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirm(true);
            }}
            className="flex min-h-10 w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-danger hover:bg-danger-tint"
          >
            {t("action.delete")}
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title={t("idea.delete.title")}
        body={t("idea.delete.body")}
        confirmLabel={t("action.confirm_delete")}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          void deleteIdea(idea.id);
          setConfirm(false);
        }}
      />
    </div>
  );
}
