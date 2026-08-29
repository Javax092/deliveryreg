import Link from "next/link";
import type { PaymentMethod } from "@prisma/client";

import type { ActionResult } from "@/modules/shared/actions/action-result";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { getCashWorkspace } from "@/modules/cash/service";
import { formatBRL } from "@/modules/shared/money/money";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";
import {
  closeCashRegister,
  createCashSupply,
  createCashWithdrawal,
  openCashRegister
} from "./actions";

export const dynamic = "force-dynamic";

const nonCashPaymentLabels: Record<Exclude<PaymentMethod, "CASH">, string> = {
  PIX: "PIX",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito"
};

export default async function CashPage({
  searchParams
}: {
  searchParams?: Promise<{ branchId?: string }>;
}) {
  const context = await requirePermission("cash:read");
  const params = await searchParams;
  const workspace = await getCashWorkspace({
    context,
    branchId: params?.branchId
  });

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface-page)] px-4 py-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-[var(--border-default)] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Controle operacional</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em]">Caixa</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Abertura, sangria, suprimento e fechamento por filial.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/caixa/historico"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold shadow-[var(--shadow-xs)]"
            >
              Histórico
            </Link>
            <Link
              href="/pdv"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-900)] px-4 text-sm font-semibold text-[var(--text-on-brand)] shadow-[var(--shadow-xs)]"
            >
              Ir para PDV
            </Link>
          </div>
        </header>

        <BranchSelector branches={workspace.branches} selectedBranchId={workspace.selectedBranchId} />

        {!workspace.selectedBranchId ? (
          <Panel title="Nenhuma unidade disponível">
            <p className="text-sm text-[var(--text-secondary)]">Seu usuário não possui filial ativa para operar caixa.</p>
          </Panel>
        ) : workspace.openSession ? (
          <OpenCashSection session={workspace.openSession} />
        ) : (
          <ClosedCashSection
            branchId={workspace.selectedBranchId}
            branchName={
              workspace.branches.find((branch) => branch.id === workspace.selectedBranchId)?.name ??
              "Unidade selecionada"
            }
          />
        )}
      </div>
    </main>
  );
}

function BranchSelector({
  branches,
  selectedBranchId
}: {
  branches: Array<{ id: string; name: string }>;
  selectedBranchId: string | null;
}) {
  return (
    <form className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)] md:max-w-sm">
      <label htmlFor="branchId" className="block text-sm font-semibold text-[var(--text-primary)]">
        Unidade
      </label>
      <select
        id="branchId"
        name="branchId"
        defaultValue={selectedBranchId ?? ""}
        className="mt-2 h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)]"
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <button className="sr-only" type="submit">
        Aplicar unidade
      </button>
    </form>
  );
}

function ClosedCashSection({ branchId, branchName }: { branchId: string; branchName: string }) {
  return (
    <Panel title="Caixa fechado" eyebrow="Sessão atual">
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(18rem,24rem)] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--warning)]">Caixa fechado</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Abra o caixa antes de registrar vendas no PDV desta unidade.
            </p>
          </div>
          <Metric label="Unidade" value={branchName} />
        </div>

        <AdminActionForm
          action={openCashRegister}
          className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-4 shadow-[var(--shadow-xs)]"
          pendingLabel="Abrindo..."
          submitLabel="Abrir caixa"
        >
          <input name="branchId" type="hidden" value={branchId} />
          <input name="idempotencyKey" type="hidden" value={`open-cash-${crypto.randomUUID()}`} />
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--text-primary)]" htmlFor="openingAmount">
              Fundo inicial
            </label>
            <input
              className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-base text-[var(--text-primary)]"
              id="openingAmount"
              inputMode="decimal"
              name="openingAmount"
              placeholder="0,00"
              required
            />
          </div>
        </AdminActionForm>
      </div>
    </Panel>
  );
}

function OpenCashSection({
  session
}: {
  session: NonNullable<Awaited<ReturnType<typeof getCashWorkspace>>["openSession"]>;
}) {
  return (
    <div className="space-y-6">
      <Panel title="Caixa aberto" eyebrow="Sessão atual">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Dinheiro esperado
            </p>
            <p className="mt-3 text-4xl font-bold tracking-[-0.02em] text-[var(--text-primary)] sm:text-5xl">
              {formatBRL(session.position.expectedCashCents)}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Valor físico que deveria existir no caixa neste momento.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Line label="Fundo inicial" value={formatBRL(session.position.openingAmountCents)} />
              <Line label="Vendas em dinheiro" value={formatBRL(session.position.cashPaymentsCents)} />
              <Line label="Suprimentos" value={formatBRL(session.position.suppliesCents)} tone="positive" />
              <Line label="Sangrias" value={formatOutflow(session.position.withdrawalsCents)} tone="negative" />
            </div>
          </div>

          <div className="grid gap-3">
            <Metric label="Unidade" value={session.branch.name} />
            <Metric label="Aberto por" value={session.openedByUser.name} />
            <Metric label="Aberto em" value={formatBusinessDateTime(session.openedAt)} />
          </div>
        </div>
      </Panel>

      <Panel title="Outros recebimentos" eyebrow="Não compõem o dinheiro físico">
        <div className="grid gap-3 sm:grid-cols-3">
          {nonCashPaymentRows(session.position.nonCashPayments).map((payment) => (
            <Metric
              key={payment.method}
              label={nonCashPaymentLabels[payment.method]}
              value={formatBRL(payment.amountCents)}
              hint={`${payment.count} pagamento${payment.count === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Suprimento e sangria">
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MovementForm
              action={createCashSupply}
              cashSessionId={session.id}
              title="Suprimento"
              description="Entrada manual de dinheiro físico no caixa."
              submitLabel="Registrar suprimento"
              variant="primary"
            />
            <MovementForm
              action={createCashWithdrawal}
              cashSessionId={session.id}
              title="Sangria"
              description="Retirada manual de dinheiro físico do caixa."
              submitLabel="Registrar sangria"
              variant="danger"
            />
          </div>
        </Panel>

        <Panel title="Fechamento">
          <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--danger)]">Operação crítica</p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              Conte o dinheiro físico antes de confirmar. O domínio calcula a diferença entre contado e esperado no fechamento.
            </p>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Metric label="Esperado" value={formatBRL(session.position.expectedCashCents)} />
            <Metric label="Contado" value="Informar abaixo" />
            <Metric label="Diferença" value="Calculada ao fechar" />
          </div>
          <AdminActionForm
            action={closeCashRegister}
            className="space-y-4"
            pendingLabel="Fechando..."
            submitLabel="Confirmar fechamento"
            variant="danger"
          >
            <input name="cashSessionId" type="hidden" value={session.id} />
            <input name="idempotencyKey" type="hidden" value={`close-cash-${session.id}-${crypto.randomUUID()}`} />
            <Field label="Dinheiro contado" htmlFor="countedCash">
              <input
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-base text-[var(--text-primary)]"
                id="countedCash"
                inputMode="decimal"
                name="countedCash"
                placeholder="0,00"
                required
              />
            </Field>
            <Field label="Observação se houver diferença" htmlFor="closingNote">
              <textarea
                className="min-h-24 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 py-2 text-[var(--text-primary)]"
                id="closingNote"
                maxLength={240}
                name="closingNote"
              />
            </Field>
          </AdminActionForm>
        </Panel>
      </section>

      <Panel title="Últimas movimentações">
        {session.movements.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma sangria ou suprimento registrado.</p>
        ) : (
          <div className="divide-y divide-[var(--border-soft)] text-sm">
            {session.movements.map((movement) => (
              <MovementRow
                key={movement.id}
                amountCents={movement.amountCents}
                actorName={movement.actor.name}
                createdAt={movement.createdAt}
                reason={movement.reason}
                type={movement.type}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function MovementForm({
  action,
  cashSessionId,
  title,
  description,
  variant,
  submitLabel
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  cashSessionId: string;
  title: string;
  description: string;
  variant: "primary" | "danger";
  submitLabel: string;
}) {
  const inputId = `${title.toLowerCase()}-amount`;
  const reasonId = `${title.toLowerCase()}-reason`;

  return (
    <AdminActionForm
      action={action}
      className="space-y-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-4"
      pendingLabel="Registrando..."
      submitLabel={submitLabel}
      variant={variant}
    >
      <input name="cashSessionId" type="hidden" value={cashSessionId} />
      <input name="idempotencyKey" type="hidden" value={`${title.toLowerCase()}-${cashSessionId}-${crypto.randomUUID()}`} />
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{description}</p>
      </div>
      <Field label="Valor" htmlFor={inputId}>
        <input
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]"
          id={inputId}
          inputMode="decimal"
          name="amount"
          placeholder="0,00"
          required
        />
      </Field>
      <Field label="Motivo" htmlFor={reasonId}>
        <input
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]"
          id={reasonId}
          maxLength={180}
          minLength={3}
          name="reason"
          required
        />
      </Field>
    </AdminActionForm>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">{eyebrow}</p> : null}
      <h2 className={eyebrow ? "mt-1 text-lg font-semibold tracking-[-0.01em]" : "text-lg font-semibold tracking-[-0.01em]"}>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-3">
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--text-primary)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[var(--text-primary)]" htmlFor={htmlFor}>
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Line({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span
        className={`shrink-0 font-semibold ${
          tone === "positive" ? "text-[var(--success)]" : tone === "negative" ? "text-[var(--danger)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function MovementRow({
  amountCents,
  actorName,
  createdAt,
  reason,
  type
}: {
  amountCents: number;
  actorName: string;
  createdAt: Date;
  reason: string;
  type: "SUPPLY" | "WITHDRAWAL";
}) {
  const isSupply = type === "SUPPLY";

  return (
    <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-start">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{isSupply ? "Entrada - Suprimento" : "Saída - Sangria"}</p>
        <p className="mt-1 text-[var(--text-secondary)]">{reason}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {actorName} - {formatBusinessDateTime(createdAt)}
        </p>
      </div>
      <p className={`font-semibold ${isSupply ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
        {isSupply ? "+" : "-"}
        {formatBRL(amountCents)}
      </p>
    </div>
  );
}

function nonCashPaymentRows(payments: Array<{ method: PaymentMethod; amountCents: number; count: number }>) {
  return (Object.keys(nonCashPaymentLabels) as Array<Exclude<PaymentMethod, "CASH">>).map((method) => {
    const payment = payments.find((item) => item.method === method);

    return {
      method,
      amountCents: payment?.amountCents ?? 0,
      count: payment?.count ?? 0
    };
  });
}

function formatOutflow(value: number) {
  return value > 0 ? `-${formatBRL(value)}` : formatBRL(value);
}
