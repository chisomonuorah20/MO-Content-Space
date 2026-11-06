"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { LogOut, Trash2 } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { getDb } from "@/lib/db";
import { relative } from "@/lib/dates";
import { useCategories, usePendingCount, useProfile } from "@/lib/hooks";
import { createCategory, deleteCategory, setProfile, ValidationError, wipeLocal } from "@/lib/repo";
import { loadDemoData } from "@/lib/demo";
import { notificationPermission, requestNotificationPermission } from "@/lib/reminders";
import { cloudEnabled, supabase } from "@/lib/supabase";
import { runSync } from "@/lib/sync";
import type { SyncMeta } from "@/lib/types";
import { useApp } from "@/components/app-provider";
import { SyncStatus, TopBar } from "@/components/shell";
import { Button, Card, ConfirmDialog, Field, IconButton, inputClass } from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="mb-5 text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

export default function SettingsPage() {
  const profile = useProfile();
  const categories = useCategories();
  const pending = usePendingCount();
  const meta = useLiveQuery(async () => (await getDb().meta.get("sync")) as SyncMeta | undefined, []);
  const { toast } = useApp();
  const router = useRouter();
  const [name, setName] = useState(profile?.first_name ?? "");
  const [newCat, setNewCat] = useState("");
  const [catError, setCatError] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [perm, setPerm] = useState(() => (typeof window === "undefined" ? "default" : notificationPermission()));

  if (!profile) return null;

  async function signOut() {
    await supabase()?.auth.signOut();
    await wipeLocal(); // clears user-visible local data and cached profile on this device
    router.replace("/sign-in");
  }

  const unsynced = profile.mode === "cloud" ? pending : 0;

  return (
    <>
      <TopBar title={t("settings.title")} />
      <div className="grid max-w-3xl gap-6">
        <Section title={t("settings.account")}>
          <div className="space-y-5">
            <Field label={t("settings.name")}>
              {(id) => (
                <input
                  id={id}
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => name.trim() && name !== profile.first_name && void setProfile({ ...profile, first_name: name.trim() })}
                />
              )}
            </Field>
            {profile.email && (
              <p className="text-sm">
                <span className="font-semibold">{t("settings.email")}:</span> {profile.email}
              </p>
            )}
          </div>
        </Section>

        <Section title={t("settings.sync")}>
          <div className="space-y-4">
            <SyncStatus />
            {!cloudEnabled || profile.mode === "local" ? (
              <p className="text-sm text-muted">{t("settings.sync.cloud_off")}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-sm text-muted">{meta?.last_success_at ? t("settings.sync.last", { when: relative(meta.last_success_at) }) : t("settings.sync.never")}</p>
                <Button variant="secondary" onClick={() => void runSync()}>
                  {t("settings.sync.now")}
                </Button>
              </div>
            )}
          </div>
        </Section>

        <Section title={t("settings.notifications")}>
          {perm === "granted" ? (
            <p className="text-sm text-muted">{t("settings.notifications.on")}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm text-muted">{perm === "denied" ? t("reminders.permission.denied") : t("reminders.permission.off")}</p>
              {perm === "default" && (
                <Button variant="secondary" onClick={async () => setPerm(await requestNotificationPermission())}>
                  {t("reminders.permission.enable")}
                </Button>
              )}
            </div>
          )}
        </Section>

        <Section title={t("settings.categories")}>
          <form
            className="mb-4 flex gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setCatError(null);
              try {
                await createCategory(newCat);
                setNewCat("");
              } catch (err) {
                setCatError(err instanceof ValidationError ? t(err.message as CopyKey) : t("error.generic"));
              }
            }}
          >
            <input aria-label={t("settings.categories.placeholder")} placeholder={t("settings.categories.placeholder")} className={inputClass} value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <Button type="submit" variant="secondary" disabled={!newCat.trim()}>
              {t("settings.categories.add")}
            </Button>
          </form>
          {catError && (
            <p role="alert" className="mb-3 text-sm text-danger">
              {catError}
            </p>
          )}
          <ul className="divide-y divide-line">
            {categories?.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{c.name}</span>
                <IconButton label={`${t("action.delete")} ${c.name}`} onClick={() => void deleteCategory(c.id)} className="hover:text-danger">
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">{t("settings.categories.remove_hint")}</p>
        </Section>

        <Section title={t("settings.appearance")}>
          <p className="text-sm text-muted">{t("settings.appearance.light")}</p>
        </Section>

        <Section title={t("settings.demo")}>
          <p className="mb-4 text-sm text-muted">{t("settings.demo.hint")}</p>
          <Button
            variant="secondary"
            loading={demoBusy}
            onClick={async () => {
              setDemoBusy(true);
              try {
                await loadDemoData();
                toast(t("toast.saved_idea"));
              } finally {
                setDemoBusy(false);
              }
            }}
          >
            {t("settings.demo.load")}
          </Button>
        </Section>

        <Button variant="secondary" className="justify-self-start text-danger" onClick={() => (unsynced ? setConfirmOut(true) : void signOut())}>
          <LogOut className="size-4" aria-hidden /> {t("settings.signout")}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOut}
        title={t("settings.signout")}
        body={t("settings.signout.pending", { pendingCount: unsynced })}
        confirmLabel={t("settings.signout.confirm")}
        onClose={() => setConfirmOut(false)}
        onConfirm={() => void signOut()}
      />
    </>
  );
}
