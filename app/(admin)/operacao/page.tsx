import Link from "next/link";

import {
  acceptOrder,
  cancelOrder,
  completeOperationalOrder,
  confirmWeight,
  markReady,
  startPreparation,
} from "./actions";

import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { OperationAutoRefresh } from "@/components/admin/OperationAutoRefresh";
import { Card } from "@/components/ui/Card";
import { formatQuantity } from "@/modules/catalog/product-domain";
import {
  listOperationalOrders,
  operationalColumns,
  type OperationalStatus,
} from "@/modules/orders/operation-board";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBRL } from "@/modules/shared/money/money";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const dynamic = "force-dynamic";

const statusLabels = {
  CREATED: "Novo",
  ACCEPTED: "Aceito",
  PREPARING: "Em preparo",
  READY: "Pronto",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
} as const;

const fulfillmentLabels = {
  PICKUP: "Retirada",
  DELIVERY: "Delivery",
} as const;

const deliveryStatusLabels = {
  ASSIGNED: "Atribuída",
  PICKED_UP: "Retirada",
  ON_ROUTE: "Em rota",
  DELIVERED: "Entregue",
  FAILED: "Falhou",
} as const;

const columnDescriptions: Record<OperationalStatus, string> = {
  CREATED: "Pedidos que acabaram de entrar",
  ACCEPTED: "Esperando início de preparo",
  PREPARING: "Em produção e pesagem",
  READY: "Prontos para finalizar",
};

const columnDotClasses: Record<OperationalStatus, string> = {
  CREATED: "bg-slate-400",
  ACCEPTED: "bg-blue-500",
  PREPARING: "bg-amber-500",
  READY: "bg-emerald-500",
};

const columnCountClasses: Record<OperationalStatus, string> = {
  CREATED:
    "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
  ACCEPTED:
    "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
  PREPARING:
    "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
  READY:
    "border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)]",
};

export default async function OperacaoPage() {
  const context = await requirePermission("orders:read");
  const orders = await listOperationalOrders(context);

  const totalOrders = orders.length;
  const criticalOrders = orders.filter(
    (order) => order.urgency === "critical",
  ).length;
  const pendingWeightOrders = orders.filter(
    (order) => order.hasPendingWeight,
  ).length;

  return (
    <main className="min-h-screen bg-[var(--surface-page)]">
      <OperationAutoRefresh />

      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Operação em tempo real
              </span>

              {criticalOrders > 0 ? (
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {criticalOrders}{" "}
                  {criticalOrders === 1 ? "pedido crítico" : "pedidos críticos"}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">
              Central de pedidos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Acompanhe entrada, aceite, produção, pesagem e saída dos pedidos
              em uma única visão operacional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-2 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Atualização automática a cada 15s
                </span>
              </div>
            </div>

            <Link
              href="/entregas"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition hover:bg-[var(--surface-soft)]"
            >
              Ver entregas
            </Link>
          </div>
        </header>

        <section aria-label="Resumo da operação" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {operationalColumns.map((column) => {
            const count = orders.filter(
              (order) => order.status === column.status,
            ).length;

            return (
              <Card key={column.status} padding="sm">
                <div className="flex min-h-12 items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          columnDotClasses[column.status]
                        }`}
                      />
                      <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                        {column.title}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {columnDescriptions[column.status]}
                    </p>
                  </div>

                  <span
                    className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold ${
                      columnCountClasses[column.status]
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </Card>
            );
          })}
        </section>

        {(criticalOrders > 0 || pendingWeightOrders > 0) && (
          <section
            aria-label="Atenções da operação"
            className="flex flex-wrap gap-2"
          >
            {criticalOrders > 0 ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                {criticalOrders} aguardando há 30 min ou mais
              </span>
            ) : null}

            {pendingWeightOrders > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                {pendingWeightOrders}{" "}
                {pendingWeightOrders === 1
                  ? "pedido com pesagem pendente"
                  : "pedidos com pesagem pendente"}
              </span>
            ) : null}

            <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              {totalOrders}{" "}
              {totalOrders === 1
                ? "pedido ativo na operação"
                : "pedidos ativos na operação"}
            </span>
          </section>
        )}

        <section
          aria-label="Quadro operacional"
          className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4"
        >
          {operationalColumns.map((column) => {
            const columnOrders = orders.filter(
              (order) => order.status === column.status,
            );

            return (
              <section
                className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-soft)] p-2.5 sm:p-3"
                key={column.status}
              >
                <div className="flex items-center justify-between gap-3 px-1 pb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          columnDotClasses[column.status]
                        }`}
                      />

                      <h2 className="truncate text-sm font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
                        {column.title}
                      </h2>
                    </div>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Próxima ação: {column.action}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      columnCountClasses[column.status]
                    }`}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnOrders.length === 0 ? (
                    <EmptyColumn status={column.status} />
                  ) : (
                    columnOrders.map((order) => (
                      <OrderCard key={order.id} order={order} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function OrderCard({
  order,
}: {
  order: Awaited<ReturnType<typeof listOperationalOrders>>[number];
}) {
  const isAttention = order.urgency === "attention";
  const isCritical = order.urgency === "critical";

  const urgencyClass = isCritical
    ? "border-red-300 shadow-[0_0_0_1px_rgba(239,68,68,0.06)]"
    : isAttention
      ? "border-amber-300"
      : order.status === "CREATED"
        ? "border-blue-200"
        : "border-[var(--border-default)]";

  return (
    <article
      className={`overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface-card)] shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)] ${urgencyClass}`}
    >
      {isCritical ? (
        <div className="bg-red-50 px-4 py-2 text-xs font-bold text-red-700">
          Atenção: aguardando há {order.waitingMinutes} min
        </div>
      ) : isAttention ? (
        <div className="bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          Tempo de espera: {order.waitingMinutes} min
        </div>
      ) : null}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                Pedido #{order.id.slice(-6).toUpperCase()}
              </h3>

              <StatusPill status={order.status} />
            </div>

            <p className="mt-1.5 truncate text-sm font-medium text-[var(--text-primary)]">
              {order.customer?.name ?? "Cliente não identificado"}
            </p>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {order.branch.name} · {order.createdAtLabel}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {formatBRL(order.totalCents)}
            </p>

            <span className="mt-1 inline-flex rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              {fulfillmentLabels[order.fulfillmentType]}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-y border-[var(--border-soft)] py-2.5">
          <span
            className={`text-xs font-semibold ${
              isCritical
                ? "text-red-700"
                : isAttention
                  ? "text-amber-700"
                  : "text-[var(--text-secondary)]"
            }`}
          >
            {order.waitingLabel}
          </span>

          <span className="text-xs text-[var(--text-muted)]">
            {order.items.length} {order.items.length === 1 ? "item" : "itens"}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {order.items.slice(0, 3).map((item) => (
            <div
              className="rounded-[var(--radius-md)] bg-[var(--surface-soft)] p-3"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-5 text-[var(--text-primary)]">
                    {item.productNameSnapshot}
                  </p>

                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    Solicitado:{" "}
                    <strong>
                      {formatQuantity({
                        measurementType: item.measurementTypeSnapshot,
                        quantity: item.requestedQuantity,
                      })}
                    </strong>
                  </p>
                </div>

                <span className="shrink-0 text-xs font-semibold text-[var(--text-secondary)]">
                  {formatBRL(item.estimatedAmountCents)}
                </span>
              </div>

              {item.measurementTypeSnapshot === "WEIGHT" ? (
                item.actualQuantity ? (
                  <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                    <p className="text-xs font-semibold text-emerald-800">
                      Peso separado:{" "}
                      {formatQuantity({
                        measurementType: item.measurementTypeSnapshot,
                        quantity: item.actualQuantity,
                      })}
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-emerald-700">
                      Registrado para controle de estoque.
                    </p>
                  </div>
                ) : (
                  <WeightConfirmation item={item} orderStatus={order.status} />
                )
              ) : null}
            </div>
          ))}

          {order.items.length > 3 ? (
            <p className="px-1 text-xs font-medium text-[var(--text-muted)]">
              + {order.items.length - 3}{" "}
              {order.items.length - 3 === 1
                ? "item adicional"
                : "itens adicionais"}
            </p>
          ) : null}
        </div>

        <OrderDetails order={order} />

        <div className="mt-4">
          <NextActionForms
            hasPendingWeight={order.hasPendingWeight}
            orderId={order.id}
            status={order.status}
          />
        </div>
      </div>
    </article>
  );
}

function WeightConfirmation({
  item,
  orderStatus,
}: {
  item: Awaited<
    ReturnType<typeof listOperationalOrders>
  >[number]["items"][number];
  orderStatus: OperationalStatus;
}) {
  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <p className="text-xs font-bold text-amber-900">Pesagem pendente</p>
      </div>

      {orderStatus === "PREPARING" ? (
        <>
          <p className="mt-1 text-[11px] leading-4 text-amber-800">
            Informe o peso efetivamente separado para realizar a baixa correta
            do estoque.
          </p>

          <AdminActionForm
            action={confirmWeight}
            className="mt-2 grid gap-2"
            pendingLabel="Salvando..."
            submitLabel="Confirmar peso"
          >
            <input name="orderItemId" type="hidden" value={item.id} />

            <input
              name="idempotencyKey"
              type="hidden"
              value={`confirm-weight-${item.id}`}
            />

            <label className="sr-only" htmlFor={`quick-weight-${item.id}`}>
              Peso real em gramas
            </label>

            <div className="relative">
              <input
                className="h-11 w-full rounded-[var(--radius-md)] border border-amber-300 bg-white px-3 pr-10 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                id={`quick-weight-${item.id}`}
                min="1"
                name="actualQuantity"
                placeholder="Ex.: 518"
                required
                type="number"
              />

              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-[var(--text-muted)]">
                g
              </span>
            </div>
          </AdminActionForm>
        </>
      ) : (
        <p className="mt-1 text-[11px] leading-4 text-amber-800">
          A pesagem será liberada quando o pedido entrar em preparo.
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: OperationalStatus }) {
  const classes: Record<OperationalStatus, string> = {
    CREATED:
      "border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
    ACCEPTED: "border-blue-200 bg-blue-50/60 text-blue-700",
    PREPARING: "border-amber-200 bg-amber-50/60 text-amber-800",
    READY: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.05em] ${classes[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function OrderDetails({
  order,
}: {
  order: Awaited<ReturnType<typeof listOperationalOrders>>[number];
}) {
  return (
    <details className="group mt-3 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]">
        <span>Ver detalhes do pedido</span>

        <span
          aria-hidden="true"
          className="text-base transition-transform group-open:rotate-180"
        >
          ⌄
        </span>
      </summary>

      <div className="space-y-5 border-t border-[var(--border-soft)] p-3 text-sm text-[var(--text-secondary)]">
        <section>
          <DetailHeading>Operação</DetailHeading>

          <div className="mt-2 space-y-1">
            <p>Filial: {order.branch.name}</p>
            <p>Atendimento: {fulfillmentLabels[order.fulfillmentType]}</p>
            <p>Criado em: {order.createdAtLabel}</p>
          </div>
        </section>

        <section>
          <DetailHeading>Cliente</DetailHeading>

          <div className="mt-2 space-y-1">
            <p className="font-medium text-[var(--text-primary)]">
              {order.customer?.name ?? "Não identificado"}
            </p>

            {order.customer?.phone ? <p>{order.customer.phone}</p> : null}

            {order.leadSource ? (
              <p>
                Origem: {order.leadSource.label} ({order.leadSource.code})
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <DetailHeading>Itens</DetailHeading>

          <div className="mt-2 space-y-2">
            {order.items.map((item) => (
              <div
                className="rounded-[var(--radius-md)] bg-[var(--surface-soft)] p-3"
                key={item.id}
              >
                <p className="font-semibold text-[var(--text-primary)]">
                  {item.productNameSnapshot}
                </p>

                <p className="mt-1">
                  Solicitado:{" "}
                  {formatQuantity({
                    measurementType: item.measurementTypeSnapshot,
                    quantity: item.requestedQuantity,
                  })}
                </p>

                {item.actualQuantity ? (
                  <p>
                    Separado:{" "}
                    {formatQuantity({
                      measurementType: item.measurementTypeSnapshot,
                      quantity: item.actualQuantity,
                    })}
                  </p>
                ) : null}

                <div className="mt-2 border-t border-[var(--border-soft)] pt-2">
                  <p>Valor do pedido: {formatBRL(item.estimatedAmountCents)}</p>

                  {item.finalAmountCents !== null ? (
                    <p className="font-semibold text-[var(--text-primary)]">
                      Valor comercial: {formatBRL(item.finalAmountCents)}
                    </p>
                  ) : null}
                </div>

                {item.measurementTypeSnapshot === "WEIGHT" &&
                order.status === "PREPARING" &&
                item.actualQuantity === null ? (
                  <p className="mt-2 font-semibold text-amber-800">
                    Confirme o peso separado pelo card do pedido.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section>
          <DetailHeading>Pagamento</DetailHeading>

          <div className="mt-2 space-y-1">
            {order.payments.length > 0 ? (
              order.payments.map((payment) => (
                <p key={`${payment.method}-${payment.createdAt.toISOString()}`}>
                  {payment.method}: {formatBRL(payment.amountCents)} ·{" "}
                  {formatBusinessDateTime(payment.createdAt)}
                </p>
              ))
            ) : (
              <p>Pagamento registrado na finalização.</p>
            )}

              <div className="mt-2 border-t border-[var(--border-soft)] pt-2">
              <div className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatBRL(order.subtotalCents)}</span>
              </div>

              {order.delivery ? (
                <div className="mt-1 flex justify-between gap-3">
                  <span>Taxa de entrega</span>
                  <span>{formatBRL(order.delivery.feeCents)}</span>
                </div>
              ) : null}

              <div className="mt-2 flex justify-between gap-3 text-base font-bold text-[var(--text-primary)]">
                <span>Total</span>
                <span>{formatBRL(order.totalCents)}</span>
              </div>
            </div>
          </div>
        </section>

        {order.delivery ? (
          <section>
            <DetailHeading>Delivery</DetailHeading>

            <div className="mt-2 space-y-1">
              <p>Status: {deliveryStatusLabels[order.delivery.status]}</p>

              <p>
                Entregador:{" "}
                {order.delivery.assignedUserId ? "Atribuído" : "Pendente"}
              </p>

              <p>
                {order.delivery.address.street}, {order.delivery.address.number}
              </p>

              <p>{order.delivery.address.neighborhood}</p>

              {order.delivery.address.reference ? (
                <p>Referência: {order.delivery.address.reference}</p>
              ) : null}

              <Link
                className="mt-3 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
                href="/entregas"
              >
                Gerenciar entrega
              </Link>
            </div>
          </section>
        ) : null}

        <section>
          <DetailHeading>Histórico</DetailHeading>

          {order.statusHistory.length === 0 ? (
            <p className="mt-2">Pedido criado e aguardando primeira ação.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {order.statusHistory.map((history) => (
                <div
                  className="border-l-2 border-[var(--border-default)] pl-3"
                  key={history.id}
                >
                  <p className="font-medium text-[var(--text-primary)]">
                    {history.fromStatus ?? "CRIADO"} → {history.toStatus}
                  </p>

                  <p className="text-xs text-[var(--text-muted)]">
                    {formatBusinessDateTime(history.createdAt)}
                    {history.reason ? ` · ${history.reason}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </details>
  );
}

function DetailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
      {children}
    </h4>
  );
}

function NextActionForms({
  hasPendingWeight,
  orderId,
  status,
}: {
  hasPendingWeight: boolean;
  orderId: string;
  status: OperationalStatus;
}) {
  if (status === "CREATED") {
    return (
      <div className="grid gap-2">
        <AdminActionForm
          action={acceptOrder}
          pendingLabel="Aceitando..."
          submitLabel="Aceitar pedido"
        >
          <input name="orderId" type="hidden" value={orderId} />
        </AdminActionForm>

        <SecondaryCancelAction orderId={orderId} />
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="grid gap-2">
        <AdminActionForm
          action={startPreparation}
          pendingLabel="Iniciando..."
          submitLabel="Iniciar preparo"
        >
          <input name="orderId" type="hidden" value={orderId} />
        </AdminActionForm>

        <SecondaryCancelAction orderId={orderId} />
      </div>
    );
  }

  if (status === "PREPARING") {
    return (
      <div className="grid gap-2">
        {hasPendingWeight ? (
          <div
            className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3"
            id={`pending-weight-${orderId}`}
          >
            <p className="text-sm font-bold text-amber-900">
              Pesagem necessária
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Confirme o peso separado dos itens antes de marcar o pedido como
              pronto.
            </p>
          </div>
        ) : (
          <AdminActionForm
            action={markReady}
            pendingLabel="Salvando..."
            submitLabel="Marcar como pronto"
          >
            <input name="orderId" type="hidden" value={orderId} />
          </AdminActionForm>
        )}

        <SecondaryCancelAction orderId={orderId} />
      </div>
    );
  }

  return (
    <AdminActionForm
      action={completeOperationalOrder}
      pendingLabel="Finalizando..."
      submitLabel="Finalizar pedido"
    >
      <input name="orderId" type="hidden" value={orderId} />

      <input
        name="idempotencyKey"
        type="hidden"
        value={`complete-order-${orderId}`}
      />
    </AdminActionForm>
  );
}

function CancelForm({ orderId }: { orderId: string }) {
  return (
    <AdminActionForm
      action={cancelOrder}
      pendingLabel="Cancelando..."
      submitLabel="Cancelar"
      variant="danger"
    >
      <input name="orderId" type="hidden" value={orderId} />
      <input name="reason" type="hidden" value="Cancelado pela operação" />
    </AdminActionForm>
  );
}

function SecondaryCancelAction({ orderId }: { orderId: string }) {
  return (
    <details className="group">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-soft)]">
        Cancelamento
      </summary>

      <div className="mt-2">
        <CancelForm orderId={orderId} />
      </div>
    </details>
  );
}

function EmptyColumn({ status }: { status: OperationalStatus }) {
  const messages: Record<
    OperationalStatus,
    { title: string; description: string }
  > = {
    CREATED: {
      title: "Novos",
      description: "Nenhum pedido aguardando aceite.",
    },
    ACCEPTED: {
      title: "Aceitos",
      description: "Nenhum pedido aguardando preparo.",
    },
    PREPARING: {
      title: "Em preparo",
      description: "Nenhum pedido em produção.",
    },
    READY: {
      title: "Prontos",
      description: "Nenhum pedido aguardando saída.",
    },
  };

  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-center">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-soft)]">
        <span
          className={`h-2.5 w-2.5 rounded-full ${columnDotClasses[status]}`}
        />
      </div>

      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {messages[status].title}
      </p>

      <p className="mt-1 max-w-52 text-xs leading-5 text-[var(--text-muted)]">
        {messages[status].description}
      </p>
    </div>
  );
}
