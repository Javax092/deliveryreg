import type { HTMLAttributes, ReactNode } from "react";

type CardVariant =
  | "default"
  | "soft"
  | "success"
  | "warning"
  | "danger";

type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
};

type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
};

type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

type CardFooterProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "border-[var(--border-default)] bg-[var(--surface-card)]",

  soft:
    "border-[var(--border-soft)] bg-[var(--surface-soft)]",

  success:
    "border-[var(--success-border)] bg-[var(--success-soft)]",

  warning:
    "border-[var(--warning-border)] bg-[var(--warning-soft)]",

  danger:
    "border-[var(--danger-border)] bg-[var(--danger-soft)]",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5 md:p-6",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={joinClasses(
        "rounded-[var(--radius-lg)] border shadow-[var(--shadow-xs)]",
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          "transition-[border-color,box-shadow] duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-xs)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={joinClasses(
        "flex flex-col gap-1.5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: CardTitleProps) {
  return (
    <h2
      className={joinClasses(
        "text-base font-semibold tracking-[-0.01em] text-[var(--text-primary)]",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={joinClasses(
        "text-sm leading-5 text-[var(--text-secondary)]",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div
      className={joinClasses("mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={joinClasses(
        "mt-4 flex items-center gap-3 border-t border-[var(--border-soft)] pt-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
