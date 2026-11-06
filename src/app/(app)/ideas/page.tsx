"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lightbulb, Plus, Search } from "lucide-react";
import { t } from "@/lib/copy";
import { ideaLabel, useAttachments, useCategories, useIdeas, useTranscripts } from "@/lib/hooks";
import type { IdeaStatus } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { IdeaCard } from "@/components/cards";
import { TopBar } from "@/components/shell";
import { Button, cx, EmptyState, inputClass, Segmented } from "@/components/ui";

type StatusFilter = IdeaStatus | "all";

export default function IdeasPage() {
  return (
    <Suspense>
      <IdeasLibrary />
    </Suspense>
  );
}

function IdeasLibrary() {
  const params = useSearchParams();
  const ideas = useIdeas();
  const atts = useAttachments();
  const transcripts = useTranscripts();
  const categories = useCategories();
  const { openCapture } = useApp();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cat, setCat] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get("focus") === "search") searchRef.current?.focus();
  }, [params]);

  // Local full-text match over title, body, transcript and link (LIB-01). Works offline.
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (ideas ?? []).filter((i) => {
      if (status !== "all" && i.status !== status) return false;
      if (cat && i.category_id !== cat) return false;
      if (!needle) return true;
      const a = atts?.get(i.id) ?? [];
      const hay = [i.title, i.body, ideaLabel(i, a), ...a.map((x) => x.external_url), ...a.map((x) => transcripts?.get(x.id)), categories?.find((c) => c.id === i.category_id)?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [ideas, atts, transcripts, categories, q, status, cat]);

  const filtering = q || status !== "all" || cat;

  return (
    <>
      <TopBar
        title={t("ideas.title")}
        actions={
          <Button onClick={() => openCapture()}>
            <Plus className="size-4" aria-hidden /> {t("nav.new_idea")}
          </Button>
        }
      />

      <div className="mb-8 space-y-4 lg:flex lg:items-center lg:gap-4 lg:space-y-0">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            aria-label={t("share.search.placeholder")}
            placeholder={t("share.search.placeholder")}
            className={cx(inputClass, "pl-10")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Segmented<StatusFilter>
          label={t("ideas.filter.status")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: t("ideas.filter.all") },
            { value: "new", label: t("idea.status.new") },
            { value: "in_progress", label: t("idea.status.in_progress") },
            { value: "completed", label: t("idea.status.completed") },
          ]}
        />
        {categories && categories.length > 0 && (
          <select aria-label={t("ideas.filter.category")} className={cx(inputClass, "lg:w-56")} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">{t("ideas.filter.any_category")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {ideas && (
        <p className="mb-4 text-sm font-medium text-muted" aria-live="polite">
          {results.length === 1 ? t("ideas.results.one") : t("ideas.results", { count: results.length })}
        </p>
      )}

      {ideas && results.length === 0 ? (
        filtering ? (
          <EmptyState icon={<Search className="size-5" />} title={t("ideas.empty_search")} />
        ) : (
          <EmptyState
            icon={<Lightbulb className="size-5" />}
            title={t("empty.ideas.title")}
            body={t("empty.ideas.body")}
            action={<Button onClick={() => openCapture()}>{t("capture.entry.title")}</Button>}
          />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {results.map((i) => (
            <IdeaCard
              key={i.id}
              idea={i}
              showStatus
              atts={atts?.get(i.id) ?? []}
              transcript={(atts?.get(i.id) ?? []).map((a) => transcripts?.get(a.id)).find(Boolean)}
              category={categories?.find((c) => c.id === i.category_id)}
            />
          ))}
        </div>
      )}
    </>
  );
}
