"use client";

import Link from "next/link";
import { CloudUpload, HardDrive, ShieldCheck } from "lucide-react";
import { t } from "@/lib/copy";
import { brandImages } from "@/lib/brand";
import { cloudEnabled } from "@/lib/supabase";
import { BrandPanel } from "@/components/auth-shell";
import { LegalLine } from "@/components/legal-line";
import { Logo } from "@/components/ui";

const primary = "flex w-full min-h-14 items-center justify-center rounded-3xl bg-primary py-5 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-primary/15 transition-all hover:bg-primary-hover active:scale-[0.98]";
const secondary = "flex w-full min-h-14 items-center justify-center rounded-3xl border border-line bg-surface py-5 text-sm font-black tracking-widest text-ink uppercase transition-all hover:border-primary/40 active:scale-[0.98]";

export default function WelcomePage() {
  return (
    <div className="flex min-h-dvh">
      <BrandPanel image={brandImages.welcomeDesktop} width="w-1/2" />
      <main className="relative flex w-full flex-col items-center justify-center overflow-hidden px-8 py-12 lg:w-1/2 lg:p-24">
        {/* Mobile: soft pattern behind the content */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-40 lg:hidden" style={{ backgroundImage: `url(${brandImages.welcomeMobile})` }} />
        <div className="flex w-full max-w-sm flex-1 flex-col lg:max-w-md lg:flex-none">
          <div className="flex justify-center lg:hidden">
            <Logo size="lg" stacked />
          </div>
          <div className="mt-16 space-y-6 text-center lg:mt-0 lg:space-y-4 lg:text-left">
            <h1 className="text-[2.6rem] leading-[1.05] font-black tracking-tighter uppercase lg:text-6xl lg:leading-[1.1] lg:normal-case">
              {t("welcome.headline.1")}
              <br />
              {t("welcome.headline.2")}
            </h1>
            <p className="mx-auto max-w-xs text-lg leading-relaxed font-medium text-muted italic lg:mx-0 lg:max-w-sm lg:text-xl lg:not-italic">{t("welcome.subtitle")}</p>
          </div>

          <ul className="mt-14 flex flex-col items-center gap-3 lg:order-last lg:mt-12 lg:flex-row lg:gap-10 lg:border-t lg:border-line lg:pt-8">
            <li className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-3.5" aria-hidden />
              <span className="text-[10px] font-black tracking-[0.15em] uppercase lg:text-xs">{cloudEnabled ? t("welcome.private") : t("welcome.private.local")}</span>
            </li>
            <li className="flex items-center gap-2 text-primary">
              {cloudEnabled ? <CloudUpload className="size-3.5" aria-hidden /> : <HardDrive className="size-3.5" aria-hidden />}
              <span className="text-[10px] font-black tracking-[0.15em] uppercase lg:text-xs">{cloudEnabled ? t("welcome.backup") : t("welcome.backup.local")}</span>
            </li>
          </ul>

          <div className="mt-auto space-y-4 pt-14 lg:mt-12 lg:pt-0">
            <Link href="/register" className={primary}>
              {t("welcome.create")}
            </Link>
            <Link href="/sign-in" className={secondary}>
              {t("welcome.signin")}
            </Link>
          </div>
          <div className="mt-10 lg:order-last lg:mt-8">
            <LegalLine />
          </div>
        </div>
      </main>
    </div>
  );
}
