"use client";

import { ChevronRight, Link2, Mic, Camera, PenLine, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { t, type CopyKey } from "@/lib/copy";

export type CaptureMode = "write" | "record" | "photo" | "link";

export const CAPTURE_ITEMS: { mode: CaptureMode; title: CopyKey; sub: CopyKey; short: CopyKey; Icon: typeof PenLine }[] = [
  { mode: "write", title: "capture.menu.write", sub: "capture.menu.write.sub", short: "capture.action.write", Icon: PenLine },
  { mode: "record", title: "capture.menu.record", sub: "capture.menu.record.sub", short: "capture.action.record", Icon: Mic },
  { mode: "photo", title: "capture.menu.photo", sub: "capture.menu.photo.sub", short: "capture.action.photo", Icon: Camera },
  { mode: "link", title: "capture.menu.link", sub: "capture.menu.link.sub", short: "capture.action.link", Icon: Link2 },
];

/** Quick_Capture_Menu — bottom sheet on mobile, small centred card on desktop. */
export function CaptureMenu({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (m: CaptureMode) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="qc-menu-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/30 backdrop:backdrop-blur-[2px] md:m-auto md:w-80"
    >
      {open && (
        <div className="overflow-hidden rounded-t-5xl bg-surface shadow-raised md:rounded-5xl">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden />
          <div className="px-8 pt-10 pb-6 text-center md:px-5 md:pt-7">
            <span className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-canvas text-primary md:mb-3 md:size-9 md:rounded-xl">
              <Zap className="size-5 md:size-4" fill="currentColor" aria-hidden />
            </span>
            <h2 id="qc-menu-title" className="text-2xl font-black tracking-tight uppercase md:text-base">
              {t("capture.entry.title")}
            </h2>
            <p className="mt-2 text-sm font-medium text-muted italic md:mt-1 md:text-[11px]">{t("capture.menu.subtitle")}</p>
          </div>
          <ul className="space-y-4 px-8 pb-8 md:space-y-2 md:px-5 md:pb-5">
            {CAPTURE_ITEMS.map(({ mode, title, sub, Icon }) => (
              <li key={mode}>
                <button
                  onClick={() => onPick(mode)}
                  className="group flex w-full items-center gap-6 rounded-4xl bg-canvas p-6 text-left transition-all hover:bg-sage/40 active:scale-[0.98] md:gap-3 md:rounded-2xl md:p-3"
                >
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-surface text-primary shadow-sm md:size-9 md:rounded-xl">
                    <Icon className="size-6 md:size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-black tracking-[0.12em] uppercase md:text-[10px]">{t(title)}</span>
                    <span className="mt-1 block text-sm text-muted md:mt-0 md:text-[9px]">{t(sub)}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted/40 transition-colors group-hover:text-primary md:size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={onClose} className="pb-safe w-full bg-canvas py-6 text-xs font-black tracking-[0.2em] text-muted uppercase hover:text-ink md:py-4 md:text-[9px]">
            {t("capture.menu.close")}
          </button>
        </div>
      )}
    </dialog>
  );
}
