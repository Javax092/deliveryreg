import Link from "next/link";

import { listCustomers360 } from "@/modules/crm/queries";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";
import { formatBRL } from "@/modules/shared/money/money";
import { requirePermission } from "@/modules/shared/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const context = await requirePermission("orders:read");
  const customers = await listCustomers360(context.businessId);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold text-slate-950">Clientes</h1>
        <p className="mt-2 text-slate-700">Histórico comercial consolidado por cliente.</p>

        <section className="mt-6 overflow-hidden rounded-lg bg-white">
          <div className="grid grid-cols-7 gap-3 bg-slate-200 px-4 py-3 text-sm font-semibold">
            <span>Cliente</span>
            <span>Segmento</span>
            <span>Pedidos</span>
            <span>Receita</span>
            <span>Ticket médio</span>
            <span>Última compra</span>
            <span>Origem</span>
          </div>
          {customers.map((customer) => (
            <Link
              className="grid grid-cols-7 gap-3 border-t border-slate-100 px-4 py-3 text-sm"
              href={`/clientes/${customer.id}`}
              key={customer.id}
            >
              <span className="font-medium text-slate-950">{customer.name}</span>
              <span>{customer.segmentLabel}</span>
              <span>{customer.orderCount}</span>
              <span>{formatBRL(customer.totalRevenueCents)}</span>
              <span>
                {customer.averageTicketCents === null
                  ? "dados insuficientes"
                  : formatBRL(customer.averageTicketCents)}
              </span>
              <span>
                {customer.lastPurchaseAt
                  ? formatBusinessDateTime(customer.lastPurchaseAt)
                  : "dados insuficientes"}
              </span>
              <span>{customer.sourceLabel}</span>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
