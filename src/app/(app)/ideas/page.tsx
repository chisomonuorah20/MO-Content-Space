"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lightbulb, Plus, Search, SlidersHorizontal } from "lucide-react";
import { t } from "@/lib/copy";
import { ideaLabel, useAttachments, useCategories, useIdeas, useTranscripts } from "@/lib/hooks";
import { createCategory, ValidationError } from "@/lib/repo";
import type { IdeaStatus } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { LibraryCard } from "@/components/library-card";
import { Avatar, NotificationsButton } from "@/components/shell";
import { Button, cx, Sheet } from "@/components/ui";

type StatusFilter = IdeaStatus | "all";
const PAGE = 12;

export default function IdeasPage() {
  return (
    <Suspense>
      <IdeasLibrary />
    </Suspense>
  );
}

const pill = (on: boolean) =>
  cx(
    "min-h-10 shrink-0 rounded-xl px-6 text-[10px] font-black tracking-widest uppercase transition-colors lg:min-h-9 lg:px-5",
    on ? "bg-primary text-white shadow-md shadow-primary/10" : "border border-line bg-canvas text-muted hover:text-ink lg:border-0 lg:bg-transparent",
  );

/** Ideas_Library */
function IdeasLibrary() {
  const params = useSearchParams();
  const ideas = useIdeas();
  const atts = useAttachments();
  const transcripts = useTranscripts();
  const categories = useCategories();
  const { openCapture, toast } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cat, setCat] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [newCat, setNewCat] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focus") === "search") searchRef.current?.focus();
  }, [params]);

  // Local full-text match over title, body, transcript, link and category (LIB-01). Works offline.
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (ideas ?? []).filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (cat && i.category_id !== cat) return false;
      if (!needle) return true;
      const a = atts?.get(i.id) ?? [];
      return [i.title, i.body, ideaLabel(i, a), ...a.map((x) => x.external_url), ...a.map((x) => transcripts?.get(x.id)), categories?.find((c) => c.id === i.category_id)?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [ideas, atts, transcripts, categories, q, status, cat]);

  const statuses: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("ideas.filter.all") },
    { value: "new", label: t("idea.status.new") },
    { value: "in_progress", label: t("idea.status.in_progress") },
    { value: "completed", label: t("idea.status.completed") },
  ];

  async function addCategory() {
    if (!newCat?.trim()) return setNewCat(null);
    try {
      const c = await createCategory(newCat);
      setCat(c.id);
      setNewCat(null);
    } catch (e) {
      toast(e instanceof ValidationError ? t(e.message as "settings.categories.duplicate") : t("error.generic"));
    }
  }

  const searchBox = (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={searchRef}
        type="search"
        aria-label={t("library.search")}
        placeholder={t("library.search")}
        className="w-full rounded-2xl border-0 bg-canvas py-4 pr-4 pl-12 text-sm font-medium placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/15 lg:border lg:border-line lg:bg-surface lg:py-3 lg:shadow-sm"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setLimit(PAGE);
        }}
      />
    </div>
  );

  const categoryChips = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] font-black tracking-widest text-muted uppercase">{t("library.categories")}</span>
      {categories?.map((c) => (
        <button
          key={c.id}
          aria-pressed={cat === c.id}
          onClick={() => setCat(cat === c.id ? "" : c.id)}
          className={cx(
            "min-h-9 rounded-xl px-4 text-[11px] font-bold transition-colors",
            cat === c.id ? "border border-primary/10 bg-sage text-primary" : "border border-line bg-surface text-ink hover:border-primary/30",
          )}
        >
          {c.name}
        </button>
      ))}
      {newCat === null ? (
        <button onClick={() => setNewCat("")} aria-label={t("settings.categories.add")} title={t("settings.categories.add")} className="flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-primary">
          <Plus className="size-3.5" />
        </button>
      ) : (
        <input
          autoFocus
          aria-label={t("settings.categories.placeholder")}
          placeholder={t("settings.categories.placeholder")}
          className="min-h-9 w-40 rounded-xl border border-primary/30 bg-surface px-3 text-xs font-semibold focus:outline-none"
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          onBlur={() => void addCategory()}
          onKeyDown={(e) => {
            if (e.key === "Enter") void addCategory();
            if (e.key === "Escape") setNewCat(null);
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {/* Mobile header (full-bleed white) */}
      <header className="sticky top-0 z-30 -mx-5 -mt-6 flex flex-col gap-6 bg-surface px-6 pt-12 pb-6 shadow-sm shadow-ink/5 sm:-mx-8 lg:hidden">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">{t("library.title")}</h1>
          <div className="flex items-center gap-3">
            <NotificationsButton />
            <Avatar />
          </div>
        </div>
        {searchBox}
        <div className="no-scrollbar -mx-6 flex items-center gap-2 overflow-x-auto px-6 pb-1" role="tablist" aria-label={t("ideas.filter.status")}>
          {statuses.map((s) => (
            <button key={s.value} role="tab" aria-selected={status === s.value} className={pill(status === s.value)} onClick={() => setStatus(s.value)}>
              {s.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />
          <button onClick={() => setTagsOpen(true)} className={cx(pill(Boolean(cat)), "flex items-center gap-2")}>
            <SlidersHorizontal className="size-3" aria-hidden /> {t("library.tags")}
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <div className="hidden lg:block">
        <h1 className="sr-only">{t("library.title")}</h1>
        <div className="mb-8 flex items-center gap-6">
          <div className="max-w-xl flex-1">{searchBox}</div>
          <div className="ml-auto flex items-center gap-4">
            <Button onClick={() => openCapture()} className="rounded-xl normal-case tracking-normal text-sm font-bold">
              <Plus className="size-4" aria-hidden /> {t("nav.new_idea")}
            </Button>
            <NotificationsButton />
            <Avatar />
          </div>
        </div>
        <div className="mb-10 flex flex-wrap items-center gap-6">
          <div className="flex gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-sm" role="tablist" aria-label={t("ideas.filter.status")}>
            {statuses.map((s) => (
              <button key={s.value} role="tab" aria-selected={status === s.value} className={pill(status === s.value)} onClick={() => setStatus(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
          {categoryChips}
        </div>
      </div>

      <div className="pt-8 lg:pt-0">
        {ideas && results.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <span className="mb-6 flex size-20 items-center justify-center rounded-4xl bg-sage/40 text-primary">
              <Lightbulb className="size-8" aria-hidden />
            </span>
            {q || status !== "all" || cat ? (
              <h2 className="text-2xl font-bold tracking-tight">{t("ideas.empty_search")}</h2>
            ) : (
              <>
                <h2 className="mb-3 text-2xl font-bold tracking-tight">{t("library.empty.title")}</h2>
                <p className="mb-8 max-w-sm text-sm leading-relaxed font-medium text-muted">{t("library.empty.body")}</p>
                <Button size="lg" onClick={() => openCapture()} className="normal-case tracking-normal">
                  {t("library.empty.cta")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="sr-only" aria-live="polite">
              {results.length === 1 ? t("ideas.results.one") : t("ideas.results", { count: results.length })}
            </p>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {results.slice(0, limit).map((i) => {
                const a = atts?.get(i.id) ?? [];
                return <LibraryCard key={i.id} idea={i} atts={a} transcript={a.map((x) => transcripts?.get(x.id)).find(Boolean)} category={categories?.find((c) => c.id === i.category_id)} />;
              })}
            </div>
            {results.length > limit && (
              <div className="mt-10 flex justify-center">
                <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                  {t("library.more")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Sheet open={tagsOpen} onClose={() => setTagsOpen(false)} title={t("library.tags")} size="sm">
        <div className="pb-6">{categoryChips}</div>
      </Sheet>
    </>
  );
}
