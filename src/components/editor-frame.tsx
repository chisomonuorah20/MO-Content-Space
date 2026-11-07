"use client";

import { X, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { t } from "@/lib/copy";
import { Button, ConfirmDialog, cx } from "./ui";

/**
 * Full-screen editor chrome from Write_Idea / Record_Voice / Capture_Media / Edit_Idea_Detail /
 * Record_Voice_Detail: round close button, spaced uppercase title, Cancel, primary action.
 */
export function EditorFrame({
  title,
  onClose,
  closeIcon = "x",
  primary,
  onPrimary,
  primaryDisabled,
  saving,
  secondary,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  closeIcon?: "x" | "back";
  primary: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  saving?: boolean;
  secondary?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const CloseIcon = closeIcon === "x" ? X : ArrowLeft;
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface/90 px-6 pt-12 pb-6 shadow-sm shadow-ink/5 backdrop-blur-md lg:bg-transparent lg:px-12 lg:pt-8 lg:pb-6 lg:shadow-none lg:backdrop-blur-none">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onClose}
            aria-label={closeIcon === "x" ? t("action.close") : t("detail.back")}
            title={closeIcon === "x" ? t("action.close") : t("detail.back")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-canvas text-muted transition-transform active:scale-90 lg:size-9 lg:border lg:border-line lg:bg-surface"
          >
            <CloseIcon className="size-5 lg:size-4" aria-hidden />
          </button>
          <h1 className="text-[10px] leading-relaxed font-black tracking-[0.3em] text-muted uppercase">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4 lg:gap-6">
          {secondary}
          <Button onClick={onPrimary} disabled={primaryDisabled} loading={saving} className="rounded-2xl px-6 py-3.5 lg:px-7">
            {primary}
          </Button>
        </div>
      </header>
      <div className="relative z-10 flex-1">{children}</div>
      {footer && (
        <footer className="pb-safe sticky bottom-0 z-40 border-t border-line bg-surface/85 px-6 pt-5 backdrop-blur-xl lg:bg-canvas/80 lg:px-12 lg:py-5">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function CancelLink({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={cx("min-h-11 text-[10px] font-black tracking-widest text-muted uppercase hover:text-ink", className)}>
      {t("action.cancel")}
    </button>
  );
}

export function LeaveDialog({ open, onStay, onDiscard }: { open: boolean; onStay: () => void; onDiscard: () => void }) {
  return <ConfirmDialog open={open} title={t("editor.leave.title")} body={t("editor.leave.body")} confirmLabel={t("editor.leave.discard")} cancelLabel={t("editor.leave.stay")} onClose={onStay} onConfirm={onDiscard} />;
}

/** Big borderless title input used across editors. */
export const titleInputClass =
  "w-full bg-transparent p-0 text-4xl leading-tight font-black tracking-tighter text-ink placeholder:text-muted/30 focus:outline-none lg:text-5xl";
export const bodyInputClass =
  "w-full resize-none bg-transparent p-0 text-lg leading-relaxed font-medium text-muted placeholder:text-muted/30 focus:outline-none";
