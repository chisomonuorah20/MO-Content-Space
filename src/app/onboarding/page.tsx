"use client";

import { useState } from "react";
import { ArrowRight, Lightbulb, Mic, Tags, Zap } from "lucide-react";
import { t, type CopyKey } from "@/lib/copy";
import { brandImages } from "@/lib/brand";
import { markOnboarded } from "@/lib/auth";
import { PLATFORMS, type Platform } from "@/lib/types";
import { Blobs, cx, Logo } from "@/components/ui";

const STEPS = [1, 2, 3] as const;
type Step = (typeof STEPS)[number];
const k = (s: Step, part: string) => `onboarding.${s}.${part}` as CopyKey;
const PLAYGROUNDS: Platform[] = ["tiktok", "instagram", "linkedin", "youtube"];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [picked, setPicked] = useState<Platform[]>([]);
  const finish = () => void markOnboarded(picked); // AppProvider then routes to Home
  const next = () => (step === 3 ? finish() : setStep((s) => (s + 1) as Step));
  const toggle = (p: Platform) => setPicked((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));

  const body = (
    <>
      <h1 className="text-5xl leading-[0.9] font-black tracking-tighter uppercase lg:text-4xl">
        {t(k(step, "title.a"))}
        <br />
        {t(k(step, "title.b"))}
      </h1>
      <p className="text-lg leading-relaxed font-medium text-muted italic lg:text-base">{t(k(step, "body"))}</p>
      {step === 1 && (
        <>
          <div className="inline-flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 shadow-md shadow-ink/5">
            <Zap className="size-3.5 text-primary" fill="currentColor" aria-hidden />
            <span className="text-[11px] font-black tracking-widest uppercase">{t("onboarding.1.chip")}</span>
          </div>
        </>
      )}
      {step === 2 && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: Mic, key: "onboarding.2.chip.a" as CopyKey, tone: "text-primary" },
            { Icon: Tags, key: "onboarding.2.chip.b" as CopyKey, tone: "text-coral-ink" },
          ].map(({ Icon, key, tone }) => (
            <div key={key} className="rounded-2xl border border-line bg-surface p-4 text-center">
              <Icon className={cx("mx-auto mb-2 size-4", tone)} aria-hidden />
              <p className="text-[10px] font-black tracking-widest uppercase">{t(key)}</p>
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <p className="eyebrow">{t("onboarding.3.playgrounds")}</p>
          <div className="flex flex-wrap gap-2">
            {PLAYGROUNDS.map((p) => (
              <button
                key={p}
                aria-pressed={picked.includes(p)}
                onClick={() => toggle(p)}
                className={cx(
                  "min-h-11 rounded-xl px-4 text-[10px] font-black tracking-widest uppercase transition-all",
                  picked.includes(p) ? "bg-primary text-white shadow-md shadow-primary/15" : "border border-line bg-surface hover:border-primary/30",
                )}
              >
                {PLATFORMS.find((x) => x.id === p)!.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <Blobs />
      {/* Mobile */}
      <main className="flex min-h-dvh flex-col p-8 pt-12 lg:hidden">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex h-1 max-w-[120px] flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
            <div className="h-full bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <button onClick={finish} className="min-h-11 text-[10px] font-black tracking-widest text-muted uppercase hover:text-primary">
            {t("onboarding.skip")}
          </button>
        </header>
        <div className="relative mb-12 flex h-56 items-center justify-center overflow-hidden rounded-4xl bg-sage/20">
          <Lightbulb className="absolute size-12 text-primary/20" aria-hidden />
          <div aria-hidden className="absolute inset-0 bg-contain bg-center bg-no-repeat mix-blend-multiply" style={{ backgroundImage: `url(${brandImages.onboarding})` }} />
        </div>
        <div className="flex-1 space-y-8" aria-live="polite">
          {body}
        </div>
        <button
          onClick={next}
          className="mt-12 flex min-h-16 w-full items-center justify-center gap-4 rounded-4xl bg-primary py-6 text-sm font-black tracking-[0.2em] text-white uppercase shadow-xl shadow-primary/20 transition-all active:scale-95"
        >
          {step === 3 ? t("onboarding.finish") : t("onboarding.continue")} <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </main>

      {/* Desktop */}
      <main className="hidden min-h-dvh items-center justify-center p-12 lg:flex">
        <div className="flex w-full max-w-3xl overflow-hidden rounded-5xl border border-line bg-surface shadow-raised">
          <aside className="flex w-[42%] flex-col bg-canvas/70 p-8">
            <Logo size="sm" />
            <ol className="mt-12 space-y-10">
              {STEPS.map((s) => (
                <li key={s} className="flex items-start gap-4">
                  <span
                    className={cx(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black",
                      s === step ? "border-primary text-primary" : s < step ? "border-primary bg-primary text-white" : "border-line text-muted/60",
                    )}
                    aria-current={s === step ? "step" : undefined}
                  >
                    {s}
                  </span>
                  <div className={cx(s !== step && "opacity-50")}>
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase">{t(k(s, "step"))}</p>
                    <p className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-muted uppercase">{t(k(s, "stepsub"))}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div aria-hidden className="mt-auto aspect-[4/3] w-full rounded-2xl bg-contain bg-center bg-no-repeat mix-blend-multiply" style={{ backgroundImage: `url(${brandImages.onboarding})` }} />
          </aside>
          <section className="flex flex-1 flex-col p-12">
            <div className="flex-1 space-y-6" aria-live="polite">
              {body}
            </div>
            <div className="mt-12 flex items-center justify-between">
              <button onClick={finish} className="min-h-11 text-[10px] font-black tracking-widest text-muted uppercase hover:text-primary">
                {t("onboarding.skip")}
              </button>
              <button
                onClick={next}
                className="flex min-h-12 items-center gap-3 rounded-2xl bg-primary px-8 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95"
              >
                {step === 3 ? t("onboarding.finish") : t("onboarding.continue")} <ArrowRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
