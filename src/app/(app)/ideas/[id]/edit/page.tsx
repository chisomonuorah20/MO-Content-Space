"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronDown, Plus } from "lucide-react";
import { t } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { useCategories, useIdea, useOnline, usePendingCount, useProfile } from "@/lib/hooks";
import { addPlatformPlan, createCategory, removePlatformPlan, setIdeaStatus, updateIdea, ValidationError } from "@/lib/repo";
import { PLATFORMS, type Idea, type IdeaStatus, type Platform, type PlatformPlan } from "@/lib/types";
import { CancelLink, EditorFrame, LeaveDialog } from "@/components/editor-frame";
import { STATUS_KEY } from "@/components/library-card";
import { PlatformIcon } from "@/components/platform-icon";
import { Button, Chip, cx, Sheet } from "@/components/ui";

/** Edit_Idea_Detail */
export default function EditIdeaPage() {
  const { id } = useParams<{ id: string }>();
  const idea = useIdea(id);
  const plans = useLiveQuery(() => getDb().platform_plans.where("idea_id").equals(id).filter((p) => !p.deleted_at).toArray(), [id]);
  if (!idea || !plans) return null;
  return <EditForm key={idea.id} idea={idea} plans={plans} />;
}

function EditForm({ idea, plans }: { idea: Idea; plans: PlatformPlan[] }) {
  const router = useRouter();
  const categories = useCategories();
  const profile = useProfile();
  const online = useOnline();
  const pending = usePendingCount();
  const [title, setTitle] = useState(idea.title ?? "");
  const [notes, setNotes] = useState(idea.body ?? "");
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [category, setCategory] = useState<string | null>(idea.category_id);
  const [platforms, setPlatforms] = useState<Platform[]>(plans.map((p) => p.platform));
  const [newCat, setNewCat] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const before = plans.map((p) => p.platform).sort().join();
  const dirty = title !== (idea.title ?? "") || notes !== (idea.body ?? "") || status !== idea.status || category !== idea.category_id || [...platforms].sort().join() !== before;
  const back = () => router.replace(`/ideas/${idea.id}`);
  const close = () => (dirty ? setLeaving(true) : back());

  // Preferred playgrounds first, then the rest (Onboarding choice).
  const order = [...(profile?.preferred_platforms ?? []), ...PLATFORMS.map((p) => p.id)].filter((p, i, a) => a.indexOf(p) === i);

  async function save() {
    setSaving(true);
    await updateIdea(idea.id, { title, body: notes, category_id: category });
    if (status !== idea.status) await setIdeaStatus(idea.id, status);
    for (const p of platforms) if (!plans.some((x) => x.platform === p)) await addPlatformPlan(idea.id, p);
    for (const p of plans) if (!platforms.includes(p.platform)) await removePlatformPlan(p.id);
    setSaving(false);
    setDone(true);
  }

  async function addCategory() {
    setCatError(null);
    if (!newCat?.trim()) return setNewCat(null);
    try {
      const c = await createCategory(newCat);
      setCategory(c.id);
      setNewCat(null);
    } catch (e) {
      setCatError(e instanceof ValidationError ? t(e.message as "settings.categories.duplicate") : t("error.generic"));
    }
  }

  const card = "w-full rounded-4xl border border-line bg-surface px-6 py-5 shadow-sm focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10 lg:rounded-3xl lg:bg-canvas lg:shadow-none";

  return (
    <EditorFrame title={t("edit.title")} onClose={close} primary={t("edit.save")} onPrimary={save} saving={saving} primaryDisabled={!dirty} secondary={<CancelLink onClick={close} />}>
      <div className="mx-auto max-w-2xl space-y-10 px-6 pt-10 pb-24 lg:rounded-5xl lg:border lg:border-line lg:bg-surface lg:p-12 lg:shadow-sm">
        <div>
          <label htmlFor="e-title" className="eyebrow mb-4 ml-1 block">
            {t("edit.idea_title")}
          </label>
          <textarea id="e-title" rows={2} className={cx(card, "resize-none text-xl leading-snug font-bold")} value={title} placeholder={t("capture.title.label")} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label htmlFor="e-notes" className="eyebrow mb-4 ml-1 block">
            {t("edit.notes")}
          </label>
          <textarea id="e-notes" rows={6} className={cx(card, "resize-y text-base leading-relaxed text-muted")} value={notes} placeholder={t("detail.notes.placeholder")} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="space-y-10 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0 lg:border-y lg:border-line lg:py-8">
          <div>
            <label htmlFor="e-status" className="eyebrow mb-4 ml-1 block">
              {t("idea.status.label")}
            </label>
            <div className="relative">
              <select id="e-status" value={status} onChange={(e) => setStatus(e.target.value as IdeaStatus)} className={cx(card, "appearance-none py-4 text-sm font-bold text-ink")}>
                {(Object.keys(STATUS_KEY) as IdeaStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-6 size-4 -translate-y-1/2 text-muted" aria-hidden />
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4 ml-1">{t("capture.category.label")}</p>
            <div className="flex flex-wrap items-center gap-3">
              {categories?.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={category === c.id}
                  onClick={() => setCategory(category === c.id ? null : c.id)}
                  className={cx(
                    "min-h-12 rounded-2xl px-7 text-[11px] font-black tracking-widest uppercase shadow-sm transition-all",
                    category === c.id ? "border border-primary/10 bg-sage text-primary" : "border border-line bg-surface text-muted hover:text-ink",
                  )}
                >
                  {c.name}
                </button>
              ))}
              {newCat === null ? (
                <button onClick={() => setNewCat("")} aria-label={t("edit.new_category")} title={t("edit.new_category")} className="flex size-12 items-center justify-center rounded-2xl border border-line bg-surface text-ink shadow-sm hover:text-primary">
                  <Plus className="size-4" />
                </button>
              ) : (
                <input
                  autoFocus
                  aria-label={t("settings.categories.placeholder")}
                  placeholder={t("settings.categories.placeholder")}
                  className="min-h-12 w-44 rounded-2xl border border-primary/30 bg-surface px-4 text-sm font-semibold focus:outline-none"
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
            {catError && (
              <p role="alert" className="mt-2 text-xs text-danger">
                {catError}
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow mb-4 ml-1">{t("edit.playgrounds")}</p>
          <div className="flex flex-wrap gap-3">
            {order.map((p) => (
              <Chip key={p} selected={platforms.includes(p)} onClick={() => setPlatforms((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]))}>
                <PlatformIcon platform={p} className="size-3.5" /> {PLATFORMS.find((x) => x.id === p)?.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <LeaveDialog open={leaving} onStay={() => setLeaving(false)} onDiscard={back} />
      <Sheet open={done} onClose={back} title={t("edit.saved.title")} size="sm" icon={<Check className="size-4" strokeWidth={3} aria-hidden />}>
        <p className="text-sm text-muted">{online && profile?.mode === "cloud" && pending === 0 ? t("edit.saved.synced") : t("edit.saved.local")}</p>
        <Button size="lg" className="mt-6 mb-4 w-full" onClick={back}>
          {t("share.done")}
        </Button>
      </Sheet>
    </EditorFrame>
  );
}
