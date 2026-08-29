import Link from "next/link";
import { notFound } from "next/navigation";
import type { PaymentMethod } from "@prisma/client";

import { getCashSessionDetail } from "@/modules/cash/queries";
import { formatBRL } from "@/modules/shared/money/money";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const dynamic = "force-dynamic";

const paymentLabels = {
  CASH: "Dinheiro",
  PIX: "PIX",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito"
} as const;

const nonCashPaymentLabels: Record<Exclude<PaymentMethod, "CASH">, string> = {
  PIX: "PIX",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito"
};

export default async function CashDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requirePermission("cash:read");
  const { id } = await params;
  const session = await getCashSessionDetail({
    context,
    cashSessionId: id
  });

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--surface-page)] px-4 py-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Documento de conferência</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em]">Caixa #{session.id.slice(-6)}</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {session.branch.name} - {session.status === "OPEN" ? "Aberto" : "Fechado"}
            </p>
          </div>
          <Link
            href="/caixa/historico"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold shadow-[var(--shadow-xs)]"
          >
            Histórico
          </Link>
        </header>

        <Panel title="Resumo da sessão">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Status" value={session.status === "OPEN" ? "Aberto" : "Fechado"} />
            <Metric label="Unidade" value={session.branch.name} />
            <Metric label="Abertura" value={formatBusinessDateTime(session.openedAt)} />
            <Metric label="Responsável" value={session.openedByUser.name} />
            <Metric label="Fechado por" value={session.closedByUser?.name ?? "-"} />
            <Metric label="Fechado em" value={session.closedAt ? formatBusinessDateTime(session.closedAt) : "-"} />
          </div>
        </Panel>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Posição">
            <div className="space-y-2">
              <Line label="Fundo inicial" value={formatBRL(session.position.openingAmountCents)} />
              <Line label="Dinheiro recebido" value={formatBRL(session.position.cashPaymentsCents)} />
              <Line label="Suprimentos" value={formatBRL(session.position.suppliesCents)} tone="positive" />
              <Line label="Sangrias" value={formatOutflow(session.position.withdrawalsCents)} tone="negative" />
              <Line
                label="Esperado"
                value={formatBRL(session.expectedCashCents ?? session.position.expectedCashCents)}
                emphasis
              />
              <Line label="Contado" value={session.countedCashCents === null ? "-" : formatBRL(session.countedCashCents)} />
              <Line
                label="Diferença"
                value={session.differenceCents === null ? "-" : differenceText(session.differenceCents)}
                tone={session.differenceCents !== null && session.differenceCents < 0 ? "negative" : session.differenceCents !== null && session.differenceCents > 0 ? "warning" : undefined}
              />
            </div>
            {session.closingNote ? (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">Observação de fechamento</p>
                <p className="mt-1 leading-6 text-[var(--text-secondary)]">{session.closingNote}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Outros pagamentos">
            <div className="space-y-2">
              {nonCashPaymentRows(session.position.nonCashPayments).map((payment) => (
                <Line
                  key={payment.method}
                  label={nonCashPaymentLabels[payment.method]}
                  value={`${formatBRL(payment.amountCents)} (${payment.count} pagamento${payment.count === 1 ? "" : "s"})`}
                />
              ))}
            </div>
          </Panel>
        </section>

        <Panel title="Movimentações">
          {session.movements.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nenhuma sangria ou suprimento registrado.</p>
          ) : (
            <div className="divide-y divide-[var(--border-soft)]">
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

        <Panel title="Pagamentos">
            {session.payments.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Nenhum pagamento vinculado a esta sessão.</p>
            ) : (
            <div className="divide-y divide-[var(--border-soft)]">
                {session.payments.map((payment) => (
                <PaymentRow
                    key={payment.id}
                  amountCents={payment.amountCents}
                  createdAt={payment.createdAt}
                  method={payment.method}
                  orderId={payment.order.id}
                  salesChannel={payment.order.salesChannel}
                  />
                ))}
              </div>
            )}
          </Panel>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-4 text-sm">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-3">
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function Line({
  label,
  value,
  emphasis,
  tone
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "positive" | "negative" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "text-[var(--success)]"
      : tone === "negative"
        ? "text-[var(--danger)]"
        : tone === "warning"
          ? "text-[var(--warning)]"
          : "text-[var(--text-primary)]";

  return (
    <div className={`flex items-start justify-between gap-4 rounded-[var(--radius-md)] border px-3 py-2 ${emphasis ? "border-[var(--border-strong)] bg-[var(--surface-muted)]" : "border-[var(--border-soft)] bg-[var(--surface-soft)]"}`}>
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`shrink-0 text-right font-semibold ${toneClass}`}>{value}</span>
    </div>
  );
}

function signedMoney(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatBRL(Math.abs(value))}`;
}

function differenceText(value: number) {
  if (value === 0) {
    return `${signedMoney(value)} (Caixa conferido)`;
  }

  return `${signedMoney(value)} (${value > 0 ? "Sobra" : "Falta"})`;
}

function formatOutflow(value: number) {
  return value > 0 ? `-${formatBRL(value)}` : formatBRL(value);
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

function PaymentRow({
  amountCents,
  createdAt,
  method,
  orderId,
  salesChannel
}: {
  amountCents: number;
  createdAt: Date;
  method: PaymentMethod;
  orderId: string;
  salesChannel: string;
}) {
  return (
    <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-start">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">
          {paymentLabels[method]} - pedido #{orderId.slice(-6)}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {salesChannel} - {formatBusinessDateTime(createdAt)}
        </p>
      </div>
      <p className="font-semibold text-[var(--text-primary)]">{formatBRL(amountCents)}</p>
    </div>
  );
}
