import { adjustStock, transferStock } from "./actions";
import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { prisma } from "@/db/prisma";
import { formatQuantity } from "@/modules/catalog/product-domain";
import { listInventoryBalances } from "@/modules/inventory/queries";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

export const dynamic = "force-dynamic";

export default async function EstoquePage() {
  const context = await requirePermission("inventory:read");
  const restrictedBranchId =
    context.role === "ATTENDANT" || context.role === "DELIVERY" ? context.branchIds[0] : undefined;
  const [branches, products, balances] = await Promise.all([
    prisma.branch.findMany({
      where: {
        businessId: context.businessId,
        isActive: true,
        ...(restrictedBranchId ? { id: restrictedBranchId } : {})
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: "asc" }
    }),
    prisma.product.findMany({
      where: { businessId: context.businessId, isActive: true },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: "asc" }
    }),
    listInventoryBalances({ businessId: context.businessId, branchId: restrictedBranchId })
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-semibold text-slate-950">Estoque</h1>
        <p className="mt-2 text-slate-700">
          Saldo calculado por movimentações: entradas, vendas, perdas, ajustes, transferências e
          devoluções.
        </p>

        <section className="mt-6 overflow-hidden rounded-lg bg-white">
          {balances.length === 0 ? (
            <div className="p-5 text-slate-700">
              <p className="font-semibold text-slate-950">Nenhuma movimentação encontrada.</p>
              <p className="mt-1 text-sm">Registre uma entrada ou ajuste para iniciar o ledger.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <div className="hidden grid-cols-8 gap-3 bg-slate-200 px-4 py-3 text-sm font-semibold md:grid">
                <span>Produto</span>
                <span>Status</span>
                <span>Unidade</span>
                <span>Entrou</span>
                <span>Vendido</span>
                <span>Perda</span>
                <span>Saldo</span>
                <span>Última movimentação</span>
              </div>
              {balances.map(({ product, summary, lastMovementAt }) => (
                <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-8 md:gap-3" key={product.id}>
                  <span className="font-medium text-slate-950">{product.name}</span>
                  <span>{product.isActive ? "Ativo" : "Inativo"}</span>
                  <span>
                    {product.availability[0]?.branch.name
                      ? `${product.availability[0].branch.name}: ${
                          product.availability[0].isAvailable ? "disponível" : "indisponível"
                        }`
                      : "Todas"}
                  </span>
                  <span>Entrou: {summary.purchased + summary.returned}</span>
                  <span>Vendido: {summary.sold}</span>
                  <span>Perda: {summary.lost}</span>
                  <span className="font-semibold">
                    Saldo:{" "}
                    {formatQuantity({
                      measurementType: product.measurementType,
                      quantity: Math.max(summary.current, 0)
                    })}
                  </span>
                  <span>{lastMovementAt ? formatBusinessDateTime(lastMovementAt) : "Sem movimento"}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <AdminActionForm
            action={adjustStock}
            className="space-y-3 rounded-lg bg-white p-4"
            pendingLabel="Registrando..."
            submitLabel="Registrar ajuste"
          >
            <h2 className="font-semibold text-slate-950">Ajuste de estoque</h2>
            <Selects branches={branches} products={products} />
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3"
              name="quantityDelta"
              placeholder="Quantidade (+ entrada, - saída)"
              required
              type="number"
            />
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3"
              name="reason"
              placeholder="Motivo"
              required
            />
          </AdminActionForm>

          <AdminActionForm
            action={transferStock}
            className="space-y-3 rounded-lg bg-white p-4"
            pendingLabel="Transferindo..."
            submitLabel="Transferir"
          >
            <h2 className="font-semibold text-slate-950">Transferência</h2>
            <select className="h-11 w-full rounded-md border border-slate-300 px-3" name="fromBranchId">
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  Origem: {branch.name}
                </option>
              ))}
            </select>
            <select className="h-11 w-full rounded-md border border-slate-300 px-3" name="toBranchId">
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  Destino: {branch.name}
                </option>
              ))}
            </select>
            <select className="h-11 w-full rounded-md border border-slate-300 px-3" name="productId">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3"
              name="quantity"
              placeholder="Quantidade"
              required
              type="number"
            />
            <input
              className="h-11 w-full rounded-md border border-slate-300 px-3"
              name="reason"
              placeholder="Motivo"
              required
            />
          </AdminActionForm>
        </div>
      </div>
    </main>
  );
}

function Selects({
  branches,
  products
}: {
  branches: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
}) {
  return (
    <>
      <select className="h-11 w-full rounded-md border border-slate-300 px-3" name="branchId">
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <select className="h-11 w-full rounded-md border border-slate-300 px-3" name="productId">
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
    </>
  );
}
