import Link from "next/link";

import { createProductAction } from "../actions";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { getProductEditorData } from "@/modules/catalog/queries";
import { requirePermission } from "@/modules/shared/auth/permissions";

export default async function NovoProdutoPage() {
  const context = await requirePermission("inventory:write");
  const { branches, categories } = await getProductEditorData(context);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <Link className="text-sm font-semibold text-emerald-800" href="/produtos">
        Voltar para produtos
      </Link>
      <div className="mt-4 border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase text-emerald-700">Catálogo</p>
        <h1 className="text-3xl font-semibold text-slate-950">Cadastrar produto</h1>
        <p className="mt-2 max-w-3xl text-slate-700">
          Defina como o produto é vendido, preço, categoria, imagem e disponibilidade por filial.
        </p>
      </div>

      <section className="mt-6">
        {categories.length === 0 || branches.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700">
            Cadastre pelo menos uma categoria ativa e uma filial ativa antes de criar produtos.
          </div>
        ) : (
          <ProductEditorForm
            action={createProductAction}
            branches={branches}
            categories={categories}
          />
        )}
      </section>
    </main>
  );
}
