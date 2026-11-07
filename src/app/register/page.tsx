"use client";

import Link from "next/link";
import { useState } from "react";
import { t, type CopyKey } from "@/lib/copy";
import { AuthError, isValidEmail, register } from "@/lib/auth";
import { cloudEnabled } from "@/lib/supabase";
import { useOnline } from "@/lib/hooks";
import { AuthHeading, AuthShell, authInput } from "@/components/auth-shell";
import { LegalLine } from "@/components/legal-line";

export default function RegisterPage() {
  const online = useOnline();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const valid = name.trim() && (cloudEnabled ? isValidEmail(email) && password.length >= 8 : true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cloudEnabled && !online) return setError(t("auth.offline"));
    setBusy(true);
    try {
      const r = await register(name, email, password);
      if (r === "confirm_email") setConfirm(true);
    } catch (err) {
      setError(err instanceof AuthError && err.message.includes(".") && !err.message.includes(" ") ? t(err.message as CopyKey) : err instanceof Error ? err.message : t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell panel={{ quote: t("auth.register.panel.quote") }}>
      <AuthHeading title={t("auth.register.title")} subtitle={t("auth.register.subtitle")} />
      {!cloudEnabled && <p className="mb-6 rounded-2xl bg-sage/50 px-4 py-3 text-xs leading-relaxed font-medium text-primary">{t("auth.local.notice2")}</p>}
      {confirm ? (
        <p role="status" className="rounded-2xl bg-sage px-4 py-4 text-sm font-medium text-primary">
          {t("auth.register.confirm")}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="name" className="eyebrow ml-1 block">
              {t("auth.name")}
            </label>
            <input id="name" required autoComplete="name" className={authInput} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
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
                <button type="button" onClick={() => setShow((s) => !s)} className="text-[10px] font-black tracking-widest text-primary uppercase hover:underline">
                  {show ? t("auth.password.hide") : t("auth.password.show")}
                </button>
              </div>
              <input
                id="password"
                type={show ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-describedby="pw-hint"
                className={authInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p id="pw-hint" className="ml-1 text-[11px] text-muted">
                {t("auth.password.hint")}
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !valid}
            className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-primary py-5 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-primary/15 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : t("auth.register.submit")}
          </button>
        </form>
      )}
      <p className="mt-12 text-center text-[11px] leading-loose font-bold tracking-widest text-muted uppercase lg:mt-10 lg:text-sm lg:font-medium lg:tracking-normal lg:normal-case">
        {t("auth.register.have")}
        <br className="lg:hidden" />{" "}
        <Link href="/sign-in" className="font-black text-primary uppercase hover:underline lg:text-[11px] lg:tracking-widest">
          {t("welcome.signin")}
        </Link>
      </p>
      <div className="mt-10">
        <LegalLine lead="legal.create" />
      </div>
    </AuthShell>
  );
}
