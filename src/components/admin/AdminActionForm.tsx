"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/modules/shared/actions/action-result";

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  pendingLabel: string;
  submitLabel: string;
  variant?: "primary" | "danger" | "secondary";
};

const buttonClass = {
  primary:
    "min-h-10 w-full rounded-[var(--radius-md)] bg-[var(--brand-900)] px-3 text-sm font-semibold text-[var(--text-on-brand)] shadow-[var(--shadow-xs)] transition disabled:bg-[var(--text-subtle)]",
  danger:
    "min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-white px-3 text-sm font-semibold text-[var(--danger)] shadow-[var(--shadow-xs)] transition disabled:border-[var(--border-default)] disabled:text-[var(--text-subtle)]",
  secondary:
    "min-h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition disabled:text-[var(--text-subtle)]"
};

export function AdminActionForm({
  action,
  children,
  className,
  disabled,
  pendingLabel,
  submitLabel,
  variant = "primary"
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const isDisabled = disabled || isPending;
  const messageId = `action-message-${submitLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <form
      aria-busy={isPending}
      aria-describedby={result?.message ? messageId : undefined}
      className={className}
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();

        if (isDisabled || !formRef.current) {
          return;
        }

        if (!formRef.current.reportValidity()) {
          return;
        }

        const formData = new FormData(formRef.current);
        setResult(null);
        startTransition(async () => {
          const nextResult = await action(formData);
          setResult(nextResult);

          if (nextResult.ok) {
            router.refresh();
          }
        });
      }}
    >
      {children}
      <button
        aria-disabled={isDisabled}
        className={buttonClass[variant]}
        disabled={isDisabled}
        type="submit"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
      {result?.message ? (
        <p
          className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium ${
            result.ok
              ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
              : "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]"
          }`}
          id={messageId}
          role={result.ok ? "status" : "alert"}
          aria-live="polite"
        >
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
