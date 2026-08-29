import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "neutral" | "info" | "success" | "warning" | "danger";

type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
};

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    "border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",

  info: "border-blue-200 bg-blue-50 text-blue-800",

  success:
    "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]",

  warning:
    "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)]",

  danger:
    "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]",
};

const dotClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--text-muted)]",
  info: "bg-blue-500",
  success: "bg-[var(--success)]",
  warning: "bg-[var(--warning)]",
  danger: "bg-[var(--danger)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-6 px-2 text-[11px]",
  md: "min-h-7 px-2.5 text-xs",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={joinClasses(
        "inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] border font-semibold leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={joinClasses(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            dotClasses[variant],
          )}
        />
      ) : null}

      {children}
    </span>
  );
}
