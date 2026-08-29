import Link from "next/link";
import { notFound } from "next/navigation";

import { updateProductAction } from "../actions";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { formatCatalogPrice, formatCentsForInput } from "@/modules/catalog/product-domain";
import { getProductEditorData } from "@/modules/catalog/queries";
import { requirePermission } from "@/modules/shared/auth/permissions";
import { formatBusinessDateTime } from "@/modules/shared/time/timezone";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarProdutoPage({ params }: Props) {
  const [{ id }, context] = await Promise.all([params, requirePermission("inventory:write")]);
  const { branches, categories, product } = await getProductEditorData(context, id);

  if (!product) {
    notFound();
  }

  const formProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    imageUrl: product.imageUrl,
    measurementType: product.measurementType,
    minimumOrderQuantity: product.minimumOrderQuantity,
    sellingIncrement: product.sellingIncrement,
    isActive: product.isActive,
    prices: product.prices.map((price) => ({
      priceCents: price.priceCents,
      basisQuantity: price.basisQuantity,
      basisUnit: price.basisUnit,
      endsAt: price.endsAt ? price.endsAt.toISOString() : null
    })),
    availability: product.availability.map((availability) => ({
      branchId: availability.branchId,
      isAvailable: availability.isAvailable
    }))
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <Link className="text-sm font-semibold text-emerald-800" href="/produtos">
        Voltar para produtos
      </Link>
      <div className="mt-4 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase text-emerald-700">Catálogo</p>
        <h1 className="text-3xl font-semibold text-slate-950">Editar produto</h1>
        <p className="mt-2 max-w-3xl text-slate-700">
          O link público permanece em <span className="font-semibold">/{product.slug}</span>.
        </p>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <ProductEditorForm
          action={updateProductAction}
          branches={branches}
          categories={categories}
          product={formProduct}
        />

        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-950">Histórico de preço</h2>
          <div className="mt-3 space-y-3 text-sm">
            {product.prices.length === 0 ? (
              <p className="text-slate-600">Nenhum preço registrado.</p>
            ) : (
              product.prices.map((price) => (
                <div className="rounded-md bg-slate-50 p-3" key={price.id}>
                  <p className="font-semibold text-slate-950">
                    {formatCatalogPrice({
                      priceCents: price.priceCents,
                      basisQuantity: price.basisQuantity,
                      basisUnit: price.basisUnit
                    })}
                  </p>
                  <p className="text-slate-600">
                    Início: {formatBusinessDateTime(price.startsAt)}
                  </p>
                  <p className="text-slate-600">
                    {price.endsAt
                      ? `Fim: ${formatBusinessDateTime(price.endsAt)}`
                      : "Preço atual"}
                  </p>
                  <p className="sr-only">{formatCentsForInput(price.priceCents)}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
