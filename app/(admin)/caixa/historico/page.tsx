import Link from "next/link";

import { listCashBranches } from "@/modules/cash/service";
import { listCashHistory } from "@/modules/cash/queries";
import { resolveManagementPeriod } from "@/modules/management/dashboard";
import { formatBRL } from "@/modules/shared/money/money";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const dynamic = "force-dynamic";

export default async function CashHistoryPage({
  searchParams
}: {
  searchParams?: Promise<{ period?: string; from?: string; to?: string; branchId?: string }>;
}) {
  const context = await requirePermission("cash:read");
  const params = await searchParams;
  const period = resolveManagementPeriod({
    preset: params?.period ?? "7d",
    from: params?.from,
    to: params?.to
  });
  const [branches, sessions] = await Promise.all([
    listCashBranches(context),
    listCashHistory({
      context,
      branchId: params?.branchId,
      from: period.from,
      to: period.to
    })
  ]);

  return (
    <main className="min-h-screen bg-[var(--surface-page)] px-4 py-6 text-[var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 border-b border-[var(--border-default)] pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">Caixa</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em]">Histórico de caixa</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {period.label}: {formatBusinessDateTime(period.from)} até {formatBusinessDateTime(period.to)}
            </p>
          </div>
          <Link
            href="/caixa"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-semibold shadow-[var(--shadow-xs)]"
          >
            Caixa atual
          </Link>
        </header>

        <form className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)] lg:grid-cols-[minmax(10rem,12rem)_repeat(2,minmax(9rem,1fr))_minmax(12rem,1fr)_auto] lg:items-end">
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--text-primary)]">
            Período
            <select className="h-11 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]" defaultValue={period.preset} name="period">
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--text-primary)]">
            Início
            <input className="h-11 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]" defaultValue={params?.from} name="from" type="date" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--text-primary)]">
            Fim
            <input className="h-11 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]" defaultValue={params?.to} name="to" type="date" />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--text-primary)]">
            Unidade
            <select className="h-11 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-[var(--text-primary)]" defaultValue={params?.branchId ?? ""} name="branchId">
              <option value="">Todas autorizadas</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <button className="min-h-11 rounded-[var(--radius-md)] bg-[var(--brand-900)] px-4 text-sm font-semibold text-[var(--text-on-brand)] shadow-[var(--shadow-xs)]">
            Aplicar
          </button>
        </form>

        {sessions.length === 0 ? (
          <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
            <h2 className="text-lg font-semibold">Sem sessões no período</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Nenhum caixa foi aberto dentro do filtro selecionado.</p>
          </section>
        ) : (
          <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sessões</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Últimas 50 sessões dentro do filtro atual.</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="border-b border-[var(--border-default)] bg-[var(--surface-soft)] text-xs uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Data</th>
                    <th className="px-3 py-2 font-semibold">Filial</th>
                    <th className="px-3 py-2 font-semibold">Aberto por</th>
                    <th className="px-3 py-2 font-semibold">Fechado por</th>
                    <th className="px-3 py-2 text-right font-semibold">Esperado</th>
                    <th className="px-3 py-2 text-right font-semibold">Contado</th>
                    <th className="px-3 py-2 text-right font-semibold">Diferença</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-[var(--border-soft)] last:border-b-0">
                      <td className="px-3 py-3">
                        <Link className="font-semibold text-[var(--text-primary)] underline-offset-2 hover:underline" href={`/caixa/${session.id}`}>
                          {formatBusinessDateTime(session.openedAt)}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{session.branch.name}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{session.openedByUser.name}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{session.closedByUser?.name ?? "-"}</td>
                      <td className="px-3 py-3 text-right font-medium">{moneyOrDash(session.expectedCashCents)}</td>
                      <td className="px-3 py-3 text-right font-medium">{moneyOrDash(session.countedCashCents)}</td>
                      <td className="px-3 py-3 text-right">{differenceLabel(session.differenceCents)}</td>
                      <td className="px-3 py-3">{statusLabel(session.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function moneyOrDash(value: number | null) {
  return value === null ? "-" : formatBRL(value);
}

function signedMoneyOrDash(value: number | null) {
  if (value === null) {
    return "-";
  }

  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${formatBRL(Math.abs(value))}`;
}

function differenceLabel(value: number | null) {
  if (value === null) {
    return <span className="text-[var(--text-muted)]">-</span>;
  }

  const label = value > 0 ? "Sobra" : value < 0 ? "Falta" : "Conferido";
  const tone =
    value > 0
      ? "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)]"
      : value < 0
        ? "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]"
        : "border-[var(--border-default)] bg-[var(--surface-soft)] text-[var(--text-secondary)]";

  return (
    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-[var(--radius-pill)] border px-2.5 text-xs font-semibold ${tone}`}>
      {signedMoneyOrDash(value)}
      <span className="font-medium">({label})</span>
    </span>
  );
}

function statusLabel(status: "OPEN" | "CLOSED") {
  const classes =
    status === "OPEN"
      ? "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--warning)]"
      : "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]";

  return (
    <span className={`inline-flex min-h-7 items-center rounded-[var(--radius-pill)] border px-2.5 text-xs font-semibold ${classes}`}>
      {status === "OPEN" ? "Aberto" : "Fechado"}
    </span>
  );
}
