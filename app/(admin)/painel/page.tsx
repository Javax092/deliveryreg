import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { getCashSummaryForPanel } from "@/modules/cash/queries";
import {
  getManagementDashboard,
  resolveManagementPeriod,
} from "@/modules/management/dashboard";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBRL } from "@/modules/shared/money/money";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const dynamic = "force-dynamic";

export default async function PainelPage({
  searchParams,
}: {
  searchParams?: Promise<{ branchId?: string }>;
}) {
  const context = await requirePermission("audit:read");
  const params = await searchParams;
  const period = resolveManagementPeriod({ preset: "today" });

  const [dashboard, cashSessions] = await Promise.all([
    getManagementDashboard({
      context,
      period,
      branchId: params?.branchId,
    }),
    getCashSummaryForPanel({
      context,
      branchId: params?.branchId,
    }),
  ]);

  const hasOpenCash = cashSessions.length > 0;

  return (
    <div className="space-y-7">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Operação de hoje
            </span>

            <span className="text-xs text-slate-500">America/Manaus</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Painel operacional
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Acompanhe vendas, pedidos, caixa, entregas e estoque das unidades em
            tempo real.
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Dados desde {formatBusinessDateTime(dashboard.period.from)}
          </p>
        </div>

        <BranchFilter
          action="/painel"
          selectedBranchId={dashboard.scope.selectedBranchId}
          branches={dashboard.scope.availableBranches}
          canSelectAll={dashboard.scope.canSelectAllBranches}
        />
      </header>

      {/* KPIs */}
      <section aria-labelledby="kpis-heading">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Resumo
          </p>

          <h2
            id="kpis-heading"
            className="mt-1 text-lg font-semibold text-slate-950"
          >
            Indicadores de hoje
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            eyebrow="Faturamento"
            label="Vendas reconhecidas"
            value={formatBRL(dashboard.sales.recognizedRevenueCents)}
            helper="Pedidos concluídos hoje"
          />

          <Metric
            eyebrow="Pedidos"
            label="Pedidos concluídos"
            value={String(dashboard.sales.completedOrders)}
            helper={
              dashboard.sales.inProgressOrders === 0
                ? "Nenhum pedido em andamento"
                : `${dashboard.sales.inProgressOrders} em andamento`
            }
          />

          <Metric
            eyebrow="Desempenho"
            label="Ticket médio"
            value={
              dashboard.sales.averageTicketCents === null
                ? "—"
                : formatBRL(dashboard.sales.averageTicketCents)
            }
            helper={
              dashboard.sales.averageTicketCents === null
                ? "Aguardando primeiras vendas"
                : "Média por pedido concluído"
            }
          />

          <Card variant={hasOpenCash ? "success" : "warning"} padding="lg">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Caixa
                </p>

                <p className="mt-2 text-sm font-medium text-slate-600">
                  Situação atual
                </p>
              </div>

              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  hasOpenCash ? "bg-emerald-500" : "bg-amber-500"
                }`}
                aria-hidden="true"
              />
            </div>

            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
              {hasOpenCash ? "Aberto" : "Fechado"}
            </p>

            <Link
              href="/caixa"
              className="mt-3 inline-flex text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
            >
              {hasOpenCash ? "Ver caixa →" : "Abrir caixa →"}
            </Link>
          </Card>
        </div>
      </section>

      {/* Operação agora */}
      <section aria-labelledby="now-heading">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Tempo real
          </p>

          <h2
            id="now-heading"
            className="mt-1 text-lg font-semibold text-slate-950"
          >
            Operação agora
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {dashboard.operationNow.map((item) => (
            <Link
              key={item.status}
              href={item.href}
              className="group rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <Card interactive padding="md" className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-slate-600">
                    {item.label}
                  </span>

                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      item.count > 0 ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    aria-hidden="true"
                  />
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <span className="text-3xl font-bold tracking-tight text-slate-950">
                    {item.count}
                  </span>

                  <span className="text-xs font-semibold text-slate-400 transition group-hover:text-emerald-700">
                    Abrir →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Atenção operacional + caixa */}
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          eyebrow="Monitoramento"
          title="Atenção operacional"
          description="Pontos que podem exigir ação da equipe."
        >
          <div className="divide-y divide-slate-100">
            <AttentionLine
              label="Pedidos em andamento"
              value={String(dashboard.sales.inProgressOrders)}
              href="/operacao"
              warning={dashboard.sales.inProgressOrders > 0}
            />

            <AttentionLine
              label="Entregas em andamento"
              value={String(dashboard.sales.deliveryInProgress)}
              href="/entregas"
              warning={dashboard.sales.deliveryInProgress > 0}
            />

            <AttentionLine
              label="Pedidos cancelados hoje"
              value={String(dashboard.sales.cancelledOrders)}
              href="/gestao"
              warning={dashboard.sales.cancelledOrders > 0}
            />

            <AttentionLine
              label="Produtos sem saldo"
              value={String(dashboard.inventoryAttention.length)}
              href="/estoque"
              warning={dashboard.inventoryAttention.length > 0}
            />
          </div>
        </Panel>

        <Panel
          eyebrow="Financeiro"
          title="Caixa"
          description="Situação das unidades selecionadas."
        >
          {cashSessions.length === 0 ? (
            <Card variant="warning" padding="md">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500"
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <p className="font-semibold text-amber-950">
                    Nenhum caixa aberto
                  </p>

                  <p className="mt-1 text-sm leading-5 text-amber-800">
                    Abra o caixa da unidade antes de iniciar vendas presenciais.
                  </p>
                </div>
              </div>

              <Link
                href="/caixa"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                Abrir caixa
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {cashSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/caixa/${session.id}`}
                  className="group block rounded-[var(--radius-lg)] outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Card variant="soft" interactive padding="md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                            aria-hidden="true"
                          />

                          <p className="truncate font-semibold text-slate-950">
                            {session.branch.name}
                          </p>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          Aberto desde{" "}
                          {formatBusinessDateTime(session.openedAt)}
                        </p>
                      </div>

                      <span className="shrink-0 text-xs font-semibold text-emerald-700">
                        Aberto
                      </span>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="text-xs text-slate-500">
                        Valor esperado agora
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-950">
                        {formatBRL(session.position.expectedCashCents)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Produtos + estoque */}
      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          eyebrow="Performance"
          title="Produtos puxando vendas"
          description="Produtos com maior receita reconhecida hoje."
        >
          {dashboard.products.length === 0 ? (
            <EmptyState
              title="Ainda não há vendas reconhecidas"
              text="Os produtos mais vendidos aparecerão aqui conforme os pedidos forem concluídos."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboard.products.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {product.name}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {product.quantityLabel} vendidos
                    </p>
                  </div>

                  <span className="shrink-0 font-semibold text-slate-950">
                    {formatBRL(product.revenueCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          eyebrow="Estoque"
          title="Estoque que exige atenção"
          description="Produtos disponíveis que estão atualmente sem saldo."
        >
          {dashboard.inventoryAttention.length === 0 ? (
            <EmptyState
              title="Estoque em ordem"
              text="Nenhum produto disponível está sem saldo neste momento."
              positive
            />
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {dashboard.inventoryAttention.slice(0, 6).map((item) => (
                  <div
                    key={`${item.productId}-${item.branchName}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {item.productName}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.branchName}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Sem saldo
                      </span>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.quantityLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/estoque"
                className="mt-4 inline-flex text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                Ver estoque →
              </Link>
            </>
          )}
        </Panel>
      </section>

      {/* Gestão */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] px-5 py-5 shadow-[var(--shadow-xs)] sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Gestão
            </p>

            <h2 className="mt-1 text-lg font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
              Quer analisar um período maior?
            </h2>

            <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
              Compare vendas, produtos, pagamentos, clientes e unidades.
            </p>
          </div>

          <Link
            href="/gestao"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-900)] px-4 text-sm font-semibold text-white no-underline shadow-[var(--shadow-xs)] transition hover:bg-[var(--brand-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2"
          >
            Abrir gestão
          </Link>
        </div>
      </section>
    </div>
  );
}

function BranchFilter({
  action,
  selectedBranchId,
  branches,
  canSelectAll,
}: {
  action: string;
  selectedBranchId: string | null;
  branches: Array<{ id: string; name: string }>;
  canSelectAll: boolean;
}) {
  return (
    <form action={action} className="w-full sm:w-auto">
      <label
        htmlFor="branchId"
        className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500"
      >
        Unidade
      </label>

      <div className="flex gap-2">
        <select
          id="branchId"
          name="branchId"
          defaultValue={selectedBranchId ?? ""}
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:min-w-56"
        >
          {canSelectAll ? <option value="">Todas as unidades</option> : null}

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="h-11 shrink-0 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          Aplicar
        </button>
      </div>
    </form>
  );
}

function Metric({
  eyebrow,
  label,
  value,
  helper,
}: {
  eyebrow: string;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card padding="lg">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        {eyebrow}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-400">{helper}</p>
    </Card>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="lg">
      <CardHeader>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
            {eyebrow}
          </p>
        ) : null}

        <CardTitle className="text-lg">{title}</CardTitle>

        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}

function AttentionLine({
  label,
  value,
  href,
  warning,
}: {
  label: string;
  value: string;
  href: string;
  warning: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            warning ? "bg-amber-500" : "bg-emerald-500"
          }`}
          aria-hidden="true"
        />

        <span className="truncate text-sm font-medium text-slate-700 transition group-hover:text-slate-950">
          {label}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`text-sm font-bold ${
            warning ? "text-amber-700" : "text-slate-950"
          }`}
        >
          {value}
        </span>

        <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600">
          →
        </span>
      </div>
    </Link>
  );
}

function EmptyState({
  title,
  text,
  positive = false,
}: {
  title: string;
  text: string;
  positive?: boolean;
}) {
  return (
    <Card
      variant={positive ? "success" : "soft"}
      padding="lg"
      className="text-center shadow-none"
    >
      <div
        className={`mx-auto mb-3 h-2.5 w-2.5 rounded-full ${
          positive ? "bg-emerald-500" : "bg-slate-300"
        }`}
        aria-hidden="true"
      />

      <p className="font-semibold text-slate-800">{title}</p>

      <p className="mx-auto mt-1 max-w-sm text-sm leading-5 text-slate-500">
        {text}
      </p>
    </Card>
  );
}
