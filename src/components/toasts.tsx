"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { t } from "@/lib/copy";

export interface Toast {
  id: string;
  message: string;
  action?: { label: string; href: string };
}

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end"
    >
      {toasts.map((x) => (
        <div
          key={x.id}
          role="status"
          className="pointer-events-auto flex max-w-md items-center gap-3 rounded-tile bg-ink px-4 py-3 text-sm text-white shadow-raised"
        >
          <span className="flex-1">{x.message}</span>
          {x.action && (
            <Link href={x.action.href} onClick={() => onDismiss(x.id)} className="font-semibold text-sage underline-offset-2 hover:underline">
              {x.action.label}
            </Link>
          )}
          <button aria-label={t("action.close")} title={t("action.close")} onClick={() => onDismiss(x.id)} className="rounded-full p-1 text-white/70 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
