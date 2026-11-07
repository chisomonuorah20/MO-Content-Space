"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { t, type CopyKey } from "@/lib/copy";
import { AuthError, updatePassword } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { authInput } from "@/components/auth-shell";
import { Blobs, Logo } from "@/components/ui";

/** Landing page for the emailed recovery link (Supabase PASSWORD_RECOVERY session). */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const timer = setTimeout(() => setReady((r) => r ?? false), 4000);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <main className="flex min-h-dvh items-start justify-center px-8 pt-20 md:items-center">
      <Blobs />
      <div className="w-full max-w-xs md:max-w-sm md:rounded-5xl md:border md:border-line md:bg-surface md:p-12 md:shadow-raised">
        <div className="mb-12 flex justify-center">
          <Logo size="lg" stacked />
        </div>
        {ready === false ? (
          <div role="alert" className="space-y-4 text-center">
            <h1 className="text-2xl font-black tracking-tight uppercase">{t("auth.reset.expired")}</h1>
            <p className="text-sm text-muted">{t("auth.reset.expired.body")}</p>
            <Link href="/forgot-password" className="inline-block text-[11px] font-black tracking-widest text-primary uppercase hover:underline">
              {t("auth.reset.submit")}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setBusy(true);
              try {
                await updatePassword(password);
                router.replace("/");
              } catch (err) {
                setError(err instanceof AuthError && err.message.startsWith("auth.") ? t(err.message as CopyKey) : t("error.generic"));
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-6"
          >
            <h1 className="text-center text-2xl font-black tracking-tight uppercase">{t("auth.reset.new.title")}</h1>
            <div className="space-y-2">
              <label htmlFor="pw" className="eyebrow ml-1 block">
                {t("auth.password")}
              </label>
              <input id="pw" type="password" minLength={8} autoComplete="new-password" className={authInput} value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="ml-1 text-[11px] text-muted">{t("auth.password.hint")}</p>
            </div>
            {error && (
              <p role="alert" className="rounded-2xl bg-danger-tint px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || password.length < 8 || !ready}
              className="flex min-h-14 w-full items-center justify-center rounded-3xl bg-primary text-xs font-black tracking-[0.2em] text-white uppercase disabled:opacity-50"
            >
              {t("auth.reset.new.submit")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
