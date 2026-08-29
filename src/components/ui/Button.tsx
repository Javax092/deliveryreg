import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonSize = "sm" | "md" | "lg";

type SharedProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type NativeButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkButtonProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-900)] text-white shadow-[var(--shadow-xs)] hover:bg-[var(--brand-800)]",
  secondary:
    "border border-[var(--border-default)] bg-white text-[var(--text-primary)] shadow-[var(--shadow-xs)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]",
  danger:
    "bg-[var(--danger)] text-white shadow-[var(--shadow-xs)] hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-8 px-3 text-xs",
  md: "min-h-10 px-4 text-sm",
  lg: "min-h-11 px-5 text-sm",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold no-underline transition-[background-color,border-color,color,box-shadow,opacity,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

function getButtonClasses(
  props: Pick<
    SharedProps,
    "variant" | "size" | "fullWidth" | "className"
  >,
): string {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  return joinClasses(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    props.fullWidth && "w-full",
    props.className,
  );
}

function ButtonLink(props: LinkButtonProps) {
  const classes = getButtonClasses(props);

  return (
    <Link
      href={props.href}
      className={classes}
      target={props.target}
      rel={props.rel}
      title={props.title}
      aria-label={props["aria-label"]}
      aria-current={props["aria-current"]}
      onClick={props.onClick}
    >
      {props.children}
    </Link>
  );
}

function NativeButton(props: NativeButtonProps) {
  const classes = getButtonClasses(props);

  return (
    <button
      type={props.type ?? "button"}
      className={classes}
      disabled={props.disabled}
      name={props.name}
      value={props.value}
      form={props.form}
      title={props.title}
      aria-label={props["aria-label"]}
      aria-pressed={props["aria-pressed"]}
      aria-expanded={props["aria-expanded"]}
      aria-controls={props["aria-controls"]}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function Button(props: ButtonProps) {
  if ("href" in props && typeof props.href === "string") {
    return <ButtonLink {...props} />;
  }

  return <NativeButton {...props} />;
}
