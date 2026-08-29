import { notFound } from "next/navigation";

import { getCustomer360 } from "@/modules/crm/queries";
import { formatBRL } from "@/modules/shared/money/money";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";
import { requirePermission } from "@/modules/shared/auth/permissions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientePage({ params }: Props) {
  const [{ id }, context] = await Promise.all([params, requirePermission("orders:read")]);
  const data = await getCustomer360({
    businessId: context.businessId,
    customerId: id
  });

  if (!data) {
    notFound();
  }

  const { customer, orders, favoriteProducts } = data;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-slate-950">{customer.name}</h1>
        <p className="mt-2 text-slate-700">{customer.phone ?? "Telefone não informado"}</p>

        <section className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Segmento" value={customer.segmentLabel} />
          <Metric label="Pedidos" value={String(customer.orderCount)} />
          <Metric label="Receita" value={formatBRL(customer.totalRevenueCents)} />
          <Metric
            label="Frequência média"
            value={
              customer.averageFrequencyDays === null
                ? "dados insuficientes"
                : `${customer.averageFrequencyDays} dias`
            }
          />
        </section>

        <section className="mt-6 rounded-lg bg-white p-4">
          <h2 className="font-semibold text-slate-950">Produtos mais comprados</h2>
          <div className="mt-3 space-y-2">
            {favoriteProducts.length === 0 ? (
              <p className="text-slate-600">dados insuficientes</p>
            ) : (
              favoriteProducts.map((product) => (
                <div className="flex justify-between border-t border-slate-100 pt-2" key={product.name}>
                  <span>{product.name}</span>
                  <span>{formatBRL(product.revenueCents)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-white p-4">
          <h2 className="font-semibold text-slate-950">Histórico de pedidos</h2>
          <div className="mt-3 space-y-3">
            {orders.map((order) => (
              <article className="border-t border-slate-100 pt-3" key={order.id}>
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">Pedido #{order.id.slice(-6)}</p>
                    <p className="text-sm text-slate-600">
                      {order.completedAt
                        ? formatBusinessDateTime(order.completedAt)
                        : formatBusinessDateTime(order.createdAt)}
                    </p>
                  </div>
                  <p className="font-semibold">{formatBRL(order.totalCents)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
