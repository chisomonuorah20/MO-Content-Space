"use client";

import { useEffect, useState } from "react";
import { HardDrive, Lightbulb, Mail } from "lucide-react";
import { t } from "@/lib/copy";
import { cloudEnabled, supabase } from "@/lib/supabase";
import { getProfile, setProfile, uid, wipeLocal } from "@/lib/repo";
import { useOnline } from "@/lib/hooks";
import { Button, Field, inputClass } from "@/components/ui";

export default function SignInPage() {
  const online = useOnline();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloud mode: when the magic link returns with a session, create the device profile.
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    const handle = async (session: Awaited<ReturnType<typeof sb.auth.getSession>>["data"]["session"]) => {
      if (!session) return;
      const existing = await getProfile();
      // Never mix accounts on one device.
      if (existing && existing.user_id !== session.user.id) await wipeLocal();
      const first = (session.user.user_metadata?.first_name as string | undefined) ?? localStorage.getItem("mo.pending_name") ?? session.user.email?.split("@")[0] ?? "";
      await setProfile({ user_id: session.user.id, first_name: first, email: session.user.email ?? null, mode: "cloud" });
    };
    void sb.auth.getSession().then(({ data }) => handle(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, session) => void handle(session));
    return () => data.subscription.unsubscribe();
  }, []);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!online) return setError(t("auth.offline"));
    setBusy(true);
    try {
      localStorage.setItem("mo.pending_name", name.trim());
      const { error } = await supabase()!.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/sign-in`, data: { first_name: name.trim() } },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  async function continueLocal(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await setProfile({ user_id: uid(), first_name: name.trim(), email: null, mode: "local" });
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
        <div className="mb-6 flex size-12 items-center justify-center rounded-tile bg-primary text-white">
          <Lightbulb className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("auth.title")}</h1>
        <p className="mt-2 text-muted">{t("auth.subtitle")}</p>

        <form onSubmit={cloudEnabled ? sendLink : continueLocal} className="mt-8 space-y-5">
          <Field label={t("auth.local.label")}>
            {(id) => <input id={id} required autoComplete="given-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          {cloudEnabled && (
            <Field label={t("auth.email.label")}>
              {(id) => <input id={id} type="email" required autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />}
            </Field>
          )}
          {error && (
            <p role="alert" className="rounded-control bg-danger-tint px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {sent ? (
            <p role="status" className="rounded-control bg-sage px-3 py-2 text-sm font-medium text-primary">
              {t("auth.email.sent")}
            </p>
          ) : (
            <Button type="submit" className="w-full" loading={busy}>
              {cloudEnabled ? <Mail className="size-4" aria-hidden /> : <HardDrive className="size-4" aria-hidden />}
              {cloudEnabled ? t("auth.email.send") : t("auth.local.continue")}
            </Button>
          )}
          {!cloudEnabled && <p className="text-sm text-muted">{t("auth.local.notice")}</p>}
        </form>
      </div>
    </main>
  );
}
