/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { ProductImageFallback } from "@/components/public/ProductImageFallback";
import { prisma } from "@/db/prisma";
import { formatCatalogPrice, formatQuantity } from "@/modules/catalog/product-domain";
import { listAdminCategories, listAdminProducts } from "@/modules/catalog/queries";
import { hasPermission, requirePermission } from "@/modules/shared/auth/permissions";

const measurementLabels = {
  WEIGHT: "Peso",
  UNIT: "Unidade",
  PACKAGE: "Pacote",
  VOLUME: "Volume",
  BOX: "Caixa"
};

const filterFieldClass =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-xs placeholder:text-slate-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15";

type Props = {
  searchParams: Promise<{
    busca?: string;
    categoria?: string;
    status?: "active" | "inactive" | "all";
    filial?: string;
  }>;
};

export default async function ProdutosPage({ searchParams }: Props) {
  const [context, params] = await Promise.all([requirePermission("inventory:read"), searchParams]);
  const canWrite = hasPermission(context, "inventory:write");
  const [products, categories, branches] = await Promise.all([
    listAdminProducts(context.businessId, {
      search: params.busca,
      categoryId: params.categoria,
      status: params.status ?? "all",
      branchId: params.filial
    }),
    listAdminCategories(context.businessId),
    prisma.branch.findMany({
      where: {
        businessId: context.businessId,
        isActive: true
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    })
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Catálogo</p>
          <h1 className="text-3xl font-semibold text-slate-950">Produtos</h1>
          <p className="mt-2 max-w-3xl text-slate-700">
            Controle o que vende, por quanto, onde aparece e como afeta estoque.
          </p>
        </div>
        {canWrite ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-4 font-semibold text-white"
            href="/produtos/novo"
          >
            Cadastrar produto
          </Link>
        ) : null}
      </div>

      <form className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="sr-only" htmlFor="busca">
          Buscar produto
        </label>
        <input
          className={filterFieldClass}
          defaultValue={params.busca}
          id="busca"
          name="busca"
          placeholder="Buscar por nome"
        />
        <select
          className={filterFieldClass}
          defaultValue={params.categoria ?? ""}
          name="categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className={filterFieldClass}
          defaultValue={params.status ?? "all"}
          name="status"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <select
          className={filterFieldClass}
          defaultValue={params.filial ?? ""}
          name="filial"
        >
          <option value="">Todas as filiais</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-md bg-emerald-800 px-4 font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
          Filtrar
        </button>
      </form>

      <section className="mt-6">
        {products.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-semibold text-slate-950">Nenhum produto encontrado.</p>
            <p className="mt-1 text-sm">Ajuste os filtros ou cadastre um novo produto.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {products.map((product) => {
              const price = product.prices[0];
              const availableBranches = product.availability.filter((item) => item.isAvailable);
              const stockTotal = product.stockByBranch.reduce(
                (total, stock) => total + stock.quantity,
                0
              );

              return (
                <article
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs"
                  key={product.id}
                >
                  <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                    <div className="overflow-hidden rounded-md border border-slate-200">
                      {product.imageUrl ? (
                        <img
                          alt={product.name}
                          className="aspect-[4/3] w-full object-cover"
                          src={product.imageUrl}
                        />
                      ) : (
                        <ProductImageFallback name={product.name} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-950">{product.name}</h2>
                          <p className="text-sm text-slate-600">
                            {product.category?.name ?? "Sem categoria"}
                          </p>
                        </div>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            product.isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border border-slate-200 bg-slate-100 text-slate-700"
                          }`}
                        >
                          {product.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="text-slate-500">Preço</p>
                          <p className="font-semibold text-slate-950">
                            {price
                              ? formatCatalogPrice({
                                  priceCents: price.priceCents,
                                  basisQuantity: price.basisQuantity,
                                  basisUnit: price.basisUnit
                                })
                              : "Sem preço ativo"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Venda</p>
                          <p className="font-semibold text-slate-950">
                            {measurementLabels[product.measurementType]} • mínimo{" "}
                            {formatQuantity({
                              measurementType: product.measurementType,
                              quantity: product.minimumOrderQuantity
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Disponibilidade</p>
                          <p className="font-semibold text-slate-950">
                            {availableBranches.length}/{branches.length} filiais
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Estoque total</p>
                          <p className="font-semibold text-slate-950">
                            {formatQuantity({
                              measurementType: product.measurementType,
                              quantity: Math.max(stockTotal, 0)
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-slate-700">
                        {branches.map((branch) => {
                          const availability = product.availability.find(
                            (item) => item.branchId === branch.id
                          );
                          const stock = product.stockByBranch.find(
                            (item) => item.branchId === branch.id
                          );
                          return (
                            <p key={branch.id}>
                              <span className="font-medium">{branch.name}:</span>{" "}
                              {availability?.isAvailable ? "disponível" : "indisponível"} •{" "}
                              {formatQuantity({
                                measurementType: product.measurementType,
                                quantity: Math.max(stock?.quantity ?? 0, 0)
                              })}
                            </p>
                          );
                        })}
                      </div>

                      {canWrite ? (
                        <Link
                          className="mt-4 inline-flex min-h-10 items-center rounded-md border border-emerald-700 px-3 text-sm font-semibold text-emerald-800"
                          href={`/produtos/${product.id}`}
                        >
                          Editar
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
