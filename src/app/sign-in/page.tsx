"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { AuthError, signIn } from "@/lib/auth";
import { cloudEnabled } from "@/lib/supabase";
import { useOnline } from "@/lib/hooks";
import { AuthHeading, AuthShell, authInput } from "@/components/auth-shell";

export default function SignInPage() {
  const online = useOnline();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cloudEnabled && !online) return setError(t("auth.offline"));
    setBusy(true);
    try {
      await signIn(email, password, name);
      // AppProvider routes on to onboarding/home once the profile exists.
    } catch (err) {
      setError(err instanceof AuthError && err.message.includes(".") ? t(err.message as CopyKey) : t("auth.signin.error"));
      setBusy(false);
    }
  }

  return (
    <AuthShell panel={{ title: t("auth.signin.panel.title"), quote: t("auth.signin.panel.quote") }}>
      <AuthHeading title={t("auth.signin.title")} subtitle={t("auth.signin.subtitle")} />
      <form onSubmit={submit} className="space-y-6" noValidate>
        {!cloudEnabled && (
          <>
            <p className="rounded-2xl bg-sage/50 px-4 py-3 text-xs leading-relaxed font-medium text-primary">{t("auth.local.notice2")}</p>
            <div className="space-y-2">
              <label htmlFor="name" className="eyebrow ml-1 block">
                {t("auth.name")}
              </label>
              <input id="name" required autoComplete="name" className={authInput} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="eyebrow ml-1 block">
            {t("auth.email")}
          </label>
          <input id="email" type="email" required={cloudEnabled} autoComplete="email" placeholder={t("auth.email.placeholder")} className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {cloudEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="password" className="eyebrow">
                {t("auth.password")}
              </label>
              <Link href="/forgot-password" className="text-[10px] font-black tracking-widest text-primary uppercase hover:underline">
                {t("auth.forgot")}
              </Link>
            </div>
            <input id="password" type="password" required autoComplete="current-password" placeholder="••••••••" className={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || (cloudEnabled ? !email || !password : !name.trim())}
          className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-3xl bg-primary py-5 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-primary/15 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <span>{t("auth.signin.title")}</span>}
          {!busy && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />}
        </button>
      </form>

      <p className="mt-12 text-center text-[11px] leading-loose font-bold tracking-widest text-muted uppercase lg:mt-10 lg:text-sm lg:normal-case lg:tracking-normal lg:font-medium">
        {t("auth.signin.new")}
        <br className="lg:hidden" />{" "}
        <Link href="/register" className="font-black text-primary uppercase hover:underline lg:text-[11px] lg:tracking-widest">
          {t("welcome.create")}
        </Link>
      </p>
      <p className="mt-8 flex items-center justify-center gap-2 text-[9px] font-bold tracking-[0.2em] text-muted/50 uppercase">
        <Lock className="size-3" aria-hidden /> {t("auth.signin.secure")}
      </p>
    </AuthShell>
  );
}
