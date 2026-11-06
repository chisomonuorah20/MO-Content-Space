"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { t } from "@/lib/copy";
import type { IdeaStatus } from "@/lib/types";

export { clsx as cx };

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
export function Button({
  variant = "primary",
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover",
        variant === "secondary" && "border border-line bg-surface text-ink hover:border-primary/40 hover:bg-canvas",
        variant === "ghost" && "text-primary hover:bg-sage/50",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className,
      )}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
}

/** Icon-only control: always has an accessible name and a desktop tooltip (PRD §15.2 Icons). */
export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, as: Tag = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <Tag className={clsx("rounded-card border border-line bg-surface shadow-card", className)}>{children}</Tag>;
}

export function SectionHeader({ title, action, badge, id }: { title: string; action?: ReactNode; badge?: ReactNode; id?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 id={id} className="text-xl font-bold tracking-tight">
          {title}
        </h2>
        {badge}
      </div>
      {action}
    </div>
  );
}

const statusStyles: Record<IdeaStatus, string> = {
  new: "bg-sage text-primary",
  in_progress: "bg-warning-tint text-warning",
  completed: "bg-canvas text-muted border border-line",
};
const statusKey = { new: "idea.status.new", in_progress: "idea.status.in_progress", completed: "idea.status.completed" } as const;

export function StatusChip({ status }: { status: IdeaStatus }) {
  return (
    <span className={clsx("inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>
      {t(statusKey[status])}
    </span>
  );
}

export function Tag({ children, tone = "sage" }: { children: ReactNode; tone?: "sage" | "coral" | "neutral" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold",
        tone === "sage" && "bg-sage text-primary",
        tone === "coral" && "bg-coral/30 text-coral-ink",
        tone === "neutral" && "bg-canvas text-muted",
      )}
    >
      {children}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-md border border-dashed border-muted/50 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
      {t("demo.badge")}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-surface/60 px-6 py-10 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-tile bg-sage/60 text-primary">{icon}</div>
      <p className="font-display font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, error, hint }: { label: string; children: (id: string) => ReactNode; error?: string | null; hint?: string }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children(id)}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  "w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

/**
 * Responsive dialog: bottom sheet on mobile, centered modal on desktop.
 * Max height with internal scroll so the footer never clips controls (PRD §15.5).
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={clsx(
        "m-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-ink/40 md:m-auto",
        size === "sm" && "md:max-w-md",
        size === "md" && "md:max-w-xl",
        size === "lg" && "md:max-w-2xl",
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col rounded-t-3xl bg-surface shadow-raised md:max-h-[85dvh] md:rounded-card">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <div>
              <h2 id={titleId} className="text-xl font-bold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <IconButton label={t("action.close")} onClick={onClose} className="-mr-2 -mt-1">
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 pb-4">{children}</div>
          {footer && <div className="border-t border-line px-6 pt-3 pb-safe md:pb-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t("action.cancel")}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{body}</p>
    </Sheet>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scroll-thin flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors",
            value === o.value ? "bg-primary text-white" : "border border-line bg-surface text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 font-medium text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
