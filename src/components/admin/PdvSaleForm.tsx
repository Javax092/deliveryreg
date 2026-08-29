"use client";

import { useMemo, type ReactNode } from "react";

import { AdminActionForm } from "@/components/admin/AdminActionForm";
import type { ActionResult } from "@/modules/shared/actions/action-result";

export function PdvSaleForm({
  action,
  children
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
}) {
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  return (
    <AdminActionForm
      action={action}
      className="mt-6 space-y-4 rounded-lg bg-white p-5"
      pendingLabel="Finalizando..."
      submitLabel="Finalizar venda"
    >
      <input name="idempotencyKey" type="hidden" value={`pos-${idempotencyKey}`} />
      {children}
    </AdminActionForm>
  );
}
