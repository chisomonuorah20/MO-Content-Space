"use client";

import clsx from "clsx";
import { Cloud, X } from "lucide-react";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { t } from "@/lib/copy";
import type { IdeaStatus } from "@/lib/types";

export { clsx as cx };

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; size?: "md" | "lg" }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-black tracking-widest uppercase transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        size === "md" && "min-h-11 rounded-2xl px-6 text-[11px]",
        size === "lg" && "min-h-14 rounded-3xl px-8 py-4 text-sm",
        variant === "primary" && "bg-primary text-white shadow-lg shadow-primary/15 hover:bg-primary-hover",
        variant === "secondary" && "border border-line bg-surface text-ink shadow-sm hover:border-primary/30",
        variant === "ghost" && "text-primary hover:bg-sage/50",
        variant === "quiet" && "text-muted hover:text-ink",
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
      <label htmlFor={id} className="eyebrow ml-1 block">
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
  "w-full rounded-2xl border border-line bg-surface px-5 py-3.5 text-sm font-medium text-ink shadow-sm placeholder:text-muted/60 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50";

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
  icon,
}: {
  icon?: ReactNode;
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
        <div className="flex max-h-[92dvh] flex-col rounded-t-5xl bg-surface shadow-raised md:max-h-[85dvh] md:rounded-4xl">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 border-b border-line/70 px-6 pt-4 pb-4 md:pt-6">
            <div className="flex items-center gap-3">
              {icon && <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20">{icon}</span>}
              <div>
              <h2 id={titleId} className="text-lg font-black tracking-tight uppercase">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
            </div>
            <IconButton label={t("action.close")} onClick={onClose} className="-mr-1 bg-canvas">
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-4">{children}</div>
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
  cancelLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
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
            {cancelLabel ?? t("action.cancel")}
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
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "min-h-10 shrink-0 rounded-xl px-5 text-[10px] font-black tracking-widest uppercase transition-colors",
            value === o.value ? "bg-primary text-white shadow-md shadow-primary/10" : "border border-line bg-canvas text-muted hover:text-ink",
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

/** Brand mark — teal tile + wordmark (designs). Name per PRD D-07. */
export function Logo({ size = "md", stacked, light }: { size?: "sm" | "md" | "lg"; stacked?: boolean; light?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-3", stacked && "flex-col gap-4")}>
      <span
        className={clsx(
          "flex items-center justify-center bg-primary text-white shadow-lg shadow-primary/20",
          size === "sm" && "size-9 rounded-xl",
          size === "md" && "size-10 rounded-xl",
          size === "lg" && "size-12 rounded-2xl",
        )}
      >
        <Cloud className={size === "lg" ? "size-5" : "size-4"} fill="currentColor" aria-hidden />
      </span>
      <span className={clsx("font-black tracking-tighter uppercase", size === "lg" ? "text-lg" : "text-sm", light ? "text-white" : "text-ink")}>
        {t("brand.full")}
      </span>
    </span>
  );
}

/** Soft blurred colour washes in the page corners (designs). Decorative only. */
export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-sage/25 blur-[100px]" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-coral/15 blur-[100px]" />
    </div>
  );
}

export function Eyebrow({ children, className, as: Tag = "p" }: { children: ReactNode; className?: string; as?: "p" | "h2" | "h3" | "span" }) {
  return <Tag className={clsx("eyebrow", className)}>{children}</Tag>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={() => onChange(!checked)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-line")}
    >
      <span className={clsx("absolute top-1 size-4 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} />
    </button>
  );
}

/** Uppercase chip used for playgrounds / categories / platform association. */
export function Chip({ selected, onClick, children, className }: { selected?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "inline-flex min-h-11 items-center gap-2 rounded-2xl px-5 text-[11px] font-black tracking-widest uppercase transition-all",
        selected ? "bg-primary text-white shadow-md shadow-primary/15" : "border border-line bg-surface text-ink hover:border-primary/30",
        className,
      )}
    >
      {children}
    </button>
  );
}
