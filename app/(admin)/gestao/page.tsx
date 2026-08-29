import Link from "next/link";

import { getCashDivergenceSummary } from "@/modules/cash/queries";
import { getManagementDashboard, resolveManagementPeriod } from "@/modules/management/dashboard";
import { formatBRL } from "@/modules/shared/money/money";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";
import { requirePermission } from "@/modules/shared/auth/permissions";

export const dynamic = "force-dynamic";

export default async function GestaoPage({
  searchParams
}: {
  searchParams?: Promise<{ period?: string; from?: string; to?: string; branchId?: string }>;
}) {
  const context = await requirePermission("audit:read");
  const params = await searchParams;
  const period = resolveManagementPeriod({
    preset: params?.period ?? "7d",
    from: params?.from,
    to: params?.to
  });
  const [dashboard, cashSummary] = await Promise.all([
    getManagementDashboard({
      context,
      period,
      branchId: params?.branchId
    }),
    getCashDivergenceSummary({
      context,
      from: period.from,
      to: period.to,
      branchId: params?.branchId
    })
  ]);
  const maxEvolution = Math.max(...dashboard.salesEvolution.map((item) => item.revenueCents), 1);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Resumo operacional do periodo</p>
              <h1 className="mt-1 text-3xl font-semibold">Gestão</h1>
              <p className="mt-2 text-sm text-slate-600">
                {dashboard.period.label}: {formatBusinessDateTime(dashboard.period.from)} ate{" "}
                {formatBusinessDateTime(dashboard.period.to)}
              </p>
            </div>
            <Link
              href="/painel"
              className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
            >
              Voltar ao painel
            </Link>
          </div>
          <Filters
            selectedPeriod={dashboard.period.preset}
            from={params?.from}
            to={params?.to}
            selectedBranchId={dashboard.scope.selectedBranchId}
            branches={dashboard.scope.availableBranches}
            canSelectAll={dashboard.scope.canSelectAllBranches}
          />
        </header>

        <section className="grid gap-3 md:grid-cols-3" aria-labelledby="management-kpis">
          <h2 id="management-kpis" className="sr-only">
            Indicadores do periodo
          </h2>
          <Metric label="Vendas reconhecidas" value={formatBRL(dashboard.sales.recognizedRevenueCents)} />
          <Metric label="Pedidos concluidos" value={String(dashboard.sales.completedOrders)} />
          <Metric
            label="Ticket medio"
            value={
              dashboard.sales.averageTicketCents === null
                ? "Sem vendas"
                : formatBRL(dashboard.sales.averageTicketCents)
            }
          />
          <Metric label="Periodo anterior" value={formatBRL(dashboard.sales.trend.previousCents)} />
          <Metric label="Comparacao" value={dashboard.sales.trend.label} />
          <Metric
            label="Cancelamentos"
            value={`${dashboard.sales.cancelledOrders}${
              dashboard.sales.cancellationRatePercent === null
                ? ""
                : ` (${dashboard.sales.cancellationRatePercent.toFixed(1).replace(".", ",")}%)`
            }`}
          />
          <Metric label="Caixas fechados" value={String(cashSummary.closedSessions)} />
          <Metric label="Diferenca em caixa" value={signedMoney(cashSummary.netDifferenceCents)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Evolucao de vendas">
            <div className="space-y-3">
              {dashboard.salesEvolution.map((item) => (
                <div key={item.dateKey} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <div className="h-2 rounded-sm bg-slate-100">
                    <div
                      className="h-2 rounded-sm bg-slate-950"
                      style={{ width: `${Math.max(4, (item.revenueCents / maxEvolution) * 100)}%` }}
                    />
                  </div>
                  <span className="font-semibold">{formatBRL(item.revenueCents)}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Resumo do periodo">
            <div className="space-y-3">
              <Line label="Vendas reconhecidas" value={formatBRL(dashboard.periodSummary.recognizedRevenueCents)} />
              <Line label="Pagamentos registrados" value={formatBRL(dashboard.periodSummary.registeredPaymentsCents)} />
              <Line label="Diferenca observada" value={formatBRL(Math.abs(dashboard.periodSummary.observedDifferenceCents))} />
              <p className="pt-2 text-xs text-slate-600">
                Diferenca nao e corrigida automaticamente; venda reconhecida e pagamento registrado possuem
                contratos operacionais separados.
              </p>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Produtos mais vendidos">
            {dashboard.products.length === 0 ? (
              <Empty text="Sem vendas reconhecidas no periodo." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2 font-medium">Produto</th>
                      <th className="py-2 font-medium">Quantidade</th>
                      <th className="py-2 text-right font-medium">Venda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.products.map((product, index) => (
                      <tr key={product.productId} className="border-t border-slate-100">
                        <td className="py-2">{index + 1}. {product.name}</td>
                        <td className="py-2">{product.quantityLabel}</td>
                        <td className="py-2 text-right font-semibold">{formatBRL(product.revenueCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title="Pagamentos registrados">
            {dashboard.payments.length === 0 ? (
              <Empty text="Nenhum pagamento registrado no periodo." />
            ) : (
              <div className="space-y-3">
                {dashboard.payments.map((payment) => (
                  <Line
                    key={payment.method}
                    label={`${payment.label} (${payment.count})`}
                    value={formatBRL(payment.amountCents)}
                  />
                ))}
              </div>
            )}
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="Filiais">
            {dashboard.branches.length === 0 ? (
              <Empty text="Sem vendas por filial no periodo." />
            ) : (
              <div className="space-y-3">
                {dashboard.branches.map((branch) => (
                  <Line
                    key={branch.branchId}
                    label={`${branch.name} (${branch.completedOrders})`}
                    value={formatBRL(branch.revenueCents)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Canais">
            {dashboard.channels.length === 0 ? (
              <Empty text="Sem vendas por canal no periodo." />
            ) : (
              <div className="space-y-3">
                {dashboard.channels.map((channel) => (
                  <Line
                    key={channel.channel}
                    label={`${channel.label} (${channel.completedOrders})`}
                    value={formatBRL(channel.revenueCents)}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Clientes">
            <div className="space-y-3">
              <Line label="Compraram no periodo" value={String(dashboard.customers.purchasedInPeriod)} />
              <Line label="Novos no periodo" value={String(dashboard.customers.newInPeriod)} />
              <Line label="Recorrentes no periodo" value={String(dashboard.customers.recurringInPeriod)} />
              {dashboard.customers.segments.map((segment) => (
                <Line key={segment.segment} label={segment.label} value={String(segment.count)} />
              ))}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
      <span>{label}</span>
      <span className="shrink-0 font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function Filters({
  selectedPeriod,
  from,
  to,
  selectedBranchId,
  branches,
  canSelectAll
}: {
  selectedPeriod: string;
  from?: string;
  to?: string;
  selectedBranchId: string | null;
  branches: Array<{ id: string; name: string }>;
  canSelectAll: boolean;
}) {
  return (
    <form className="grid gap-3 md:grid-cols-[minmax(10rem,12rem)_repeat(2,minmax(9rem,1fr))_minmax(12rem,1fr)_auto] md:items-end">
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Periodo
        <select
          name="period"
          defaultValue={selectedPeriod}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          <option value="today">Hoje</option>
          <option value="yesterday">Ontem</option>
          <option value="7d">7 dias</option>
          <option value="30d">30 dias</option>
          <option value="custom">Personalizado</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Inicio
        <input
          name="from"
          type="date"
          defaultValue={from}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Fim
        <input
          name="to"
          type="date"
          defaultValue={to}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        Unidade
        <select
          name="branchId"
          defaultValue={selectedBranchId ?? ""}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          {canSelectAll ? <option value="">Todas as unidades</option> : null}
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2">
        Aplicar
      </button>
    </form>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-slate-600">{text}</p>;
}

function signedMoney(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatBRL(Math.abs(value))}`;
}
