"use client";

import type { ReactNode } from "react";
import { brandImages } from "@/lib/brand";
import { Blobs, Logo } from "./ui";

/** Brand image panel: tinted fallback colour underneath so overlay text stays legible. */
export function BrandPanel({ image, title, quote, width = "w-5/12" }: { image: string; title?: string; quote?: string; width?: string }) {
  return (
    <div className={`relative hidden overflow-hidden border-r border-line bg-primary/70 lg:block ${width}`}>
      <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-primary/10 to-transparent" />
      <div className="absolute top-12 left-12">
        <Logo light />
      </div>
      {(title || quote) && (
        <div className="absolute right-12 bottom-16 left-12 text-white">
          {title && <p className="mb-2 text-3xl font-black tracking-tight uppercase drop-shadow-md">{title}</p>}
          {quote && <p className="text-lg font-bold tracking-tight italic opacity-90 drop-shadow-md">{quote}</p>}
        </div>
      )}
    </div>
  );
}

/** Split auth layout from the Auth_SignIn / Auth_Registration frames. */
export function AuthShell({ panel, children }: { panel: { title?: string; quote?: string }; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Blobs />
      <BrandPanel image={brandImages.authPanel} {...panel} />
      <main className="flex w-full items-start justify-center px-8 pt-16 pb-12 lg:w-7/12 lg:items-center lg:p-24">
        <div className="w-full max-w-xs lg:max-w-md">
          <div className="mb-12 flex justify-center lg:hidden">
            <Logo size="lg" stacked />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-10 space-y-3 text-center lg:text-left">
      <h1 className="text-3xl font-black tracking-tight uppercase lg:text-4xl lg:tracking-tighter lg:normal-case">{title}</h1>
      <p className="text-sm leading-relaxed font-medium text-muted italic lg:text-base lg:not-italic">{subtitle}</p>
    </div>
  );
}

export const authInput =
  "w-full rounded-2xl border border-line bg-surface px-6 py-4 text-sm font-medium shadow-sm placeholder:text-muted/50 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10";
