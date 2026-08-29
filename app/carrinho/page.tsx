import Link from "next/link";

import { CartCheckout } from "@/components/public/CartCheckout";
import { resolvePublicSourceCode } from "@/modules/leads/source";
import { listPublicBranches } from "@/modules/public-catalog/branches";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    origem?: string;
    source?: string;
  }>;
};

export default async function CarrinhoPage({ searchParams }: Props) {
  const params = await searchParams;
  const sourceCode = resolvePublicSourceCode(params);
  const branches = await listPublicBranches({ sourceCode });
  const catalogHref = sourceCode ? `/catalogo?origem=${encodeURIComponent(sourceCode)}` : "/catalogo";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface-page)]">
      <section className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-7">
        <Link className="text-sm font-semibold text-[var(--success)]" href={catalogHref}>
          Voltar ao catálogo
        </Link>
        <div className="mt-4">
          <h1 className="text-3xl font-semibold leading-tight text-[var(--text-primary)]">
            Carrinho
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Confira os itens, escolha retirada ou entrega e confirme o pedido.
          </p>
        </div>
        <div className="mt-5">
          <CartCheckout branches={branches} sourceCode={sourceCode} />
        </div>
      </section>
    </main>
  );
}
