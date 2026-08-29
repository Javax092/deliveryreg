"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/Button";

export function OperationSubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "danger" | "secondary";
}) {
  const { pending } = useFormStatus();

  const buttonVariant = {
    primary: "primary",
    danger: "danger",
    secondary: "secondary",
  } as const;

  return (
    <Button
      disabled={pending}
      fullWidth
      type="submit"
      variant={buttonVariant[variant]}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
