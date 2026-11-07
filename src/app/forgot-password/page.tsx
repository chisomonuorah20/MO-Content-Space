"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { AuthError, isValidEmail, sendReset } from "@/lib/auth";
import { cloudEnabled } from "@/lib/supabase";
import { authInput } from "@/components/auth-shell";
import { Blobs, Logo } from "@/components/ui";

/** Auth_PasswordRecovery — mobile full-screen, desktop centred card. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid = touched && !isValidEmail(email);

  async function send() {
    setTouched(true);
    setError(null);
    if (!isValidEmail(email)) return;
    setBusy(true);
    try {
      await sendReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof AuthError && e.message.startsWith("auth.") ? t(e.message as CopyKey) : t("error.generic"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-start justify-center px-8 pt-20 md:items-center md:p-8">
      <Blobs />
      <div className="w-full max-w-xs md:max-w-sm md:rounded-5xl md:border md:border-line md:bg-surface md:p-12 md:shadow-raised">
        <div className="mb-12 flex justify-center">
          <Logo size="lg" stacked />
        </div>
        {!sent ? (
          <>
            <div className="mb-10 space-y-3 text-center">
              <h1 className="text-3xl font-black tracking-tight uppercase">{t("auth.reset.title")}</h1>
              <p className="text-sm leading-relaxed font-medium text-muted italic">{t("auth.reset.subtitle")}</p>
            </div>
            {!cloudEnabled && <p className="mb-6 rounded-2xl bg-sage/50 px-4 py-3 text-xs font-medium text-primary">{t("auth.reset.local")}</p>}
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="email" className="eyebrow ml-1 block">
                  {t("auth.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.email.placeholder")}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? "email-err" : undefined}
                  className={`${authInput} ${invalid ? "border-danger/50 ring-4 ring-danger/10" : ""}`}
                  value={email}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {invalid && (
                  <p id="email-err" role="alert" className="ml-1 text-[11px] font-bold text-danger">
                    {t("auth.reset.invalid")}
                  </p>
                )}
              </div>
              {error && (
                <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || !cloudEnabled}
                className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-primary py-5 text-xs font-black tracking-[0.2em] text-white uppercase shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : t("auth.reset.submit")}
              </button>
            </form>
          </>
        ) : (
          <div role="status" className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-sage text-primary">
              <MailCheck className="size-7" aria-hidden />
            </div>
            <h1 className="text-2xl font-black tracking-tight uppercase">{t("auth.reset.sent.title")}</h1>
            <p className="text-sm text-muted">
              {t("auth.reset.sent.body")} <span className="font-bold break-all text-ink">{email}</span>.
            </p>
            <div className="rounded-2xl bg-canvas p-4">
              <p className="text-xs font-bold text-muted">{t("auth.reset.again")}</p>
              <button onClick={() => void send()} disabled={busy} className="mt-1 text-[11px] font-black tracking-widest text-primary uppercase hover:underline">
                {t("auth.reset.resend")}
              </button>
            </div>
            <p className="text-xs text-muted/80">{t("auth.reset.spam")}</p>
          </div>
        )}
        <div className="mt-12 border-line md:border-t md:pt-8">
          <Link href="/sign-in" className="flex min-h-11 items-center justify-center gap-2 text-[11px] font-black tracking-widest text-muted uppercase hover:text-ink">
            <ArrowLeft className="size-3.5" aria-hidden /> {t("auth.reset.back")}
          </Link>
        </div>
      </div>
    </main>
  );
}
