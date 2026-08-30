import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { AnalyticsPing } from "@/components/public/AnalyticsPing";
import { CatalogCartSummary } from "@/components/public/CatalogCartSummary";
import { CatalogSearch } from "@/components/public/CatalogSearch";
import { PublicProductCard } from "@/components/public/PublicProductCard";
import { resolvePublicSourceCode } from "@/modules/leads/source";
import { getPublicCatalog } from "@/modules/public-catalog/queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    origem?: string;
    source?: string;
    busca?: string;
    categoria?: string;
  }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
  const params = await searchParams;
  const sourceCode = resolvePublicSourceCode(params);
  const catalog = await getPublicCatalog({
    sourceCode,
    search: params.busca,
    categorySlug: params.categoria
  });

  if (!catalog) {
    return (
      <main className="mx-auto min-h-screen max-w-lg px-5 py-10">
        <h1 className="text-2xl font-semibold text-slate-950">Catálogo indisponível</h1>
        <p className="mt-2 text-slate-700">Tente novamente em alguns instantes.</p>
      </main>
    );
  }

  const query = new URLSearchParams();
  if (sourceCode) {
    query.set("origem", sourceCode);
  }
  const productSuffix = query.toString() ? `?${query.toString()}` : "";

  function catalogHref(input?: { categoria?: string | null; busca?: string | null }) {
    const next = new URLSearchParams();
    if (sourceCode) {
      next.set("origem", sourceCode);
    }
    if (input?.categoria) {
      next.set("categoria", input.categoria);
    }
    if (input?.busca) {
      next.set("busca", input.busca);
    }

    const suffix = next.toString();
    return suffix ? `/catalogo?${suffix}` : "/catalogo";
  }

  const productCount = catalog.categories.reduce(
    (total, category) => total + category.products.length,
    0
  );
  const hasSearch = Boolean(params.busca?.trim());
  const activeCategory = params.categoria
    ? catalog.categoryNav.find((category) => category.slug === params.categoria)
    : null;
  const sectionTitle = activeCategory?.name ?? (hasSearch ? "Resultados da busca" : "Todos os produtos");
  const cartHref = sourceCode ? `/carrinho?origem=${encodeURIComponent(sourceCode)}` : "/carrinho";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface-page)] pb-36 text-[var(--text-primary)]">
      <AnalyticsPing eventType="catalog_viewed" sourceCode={sourceCode} />
      <header className="border-b border-[var(--border-soft)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 leading-tight">
              <h1 className="truncate text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                {catalog.business.name}
              </h1>
              <p className="mt-0.5 truncate text-xs font-medium text-[var(--text-muted)] sm:text-sm">
                Produtos regionais • Manaus
              </p>
            </div>
            <Link
              aria-label="Ver carrinho"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--border-default)] bg-white text-[var(--brand-900)] shadow-[var(--shadow-xs)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)]"
              href={cartHref}
            >
              <ShoppingBag aria-hidden="true" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6 sm:pb-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--success)]">Produtos frescos e regionais</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">
              Escolha seus produtos e faça seu pedido de forma simples.
            </h2>
            {catalog.source?.branch?.name ? (
              <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">
                Unidade {catalog.source.branch.name}
              </p>
            ) : null}
          </div>
          <div className="mt-4 max-w-2xl">
            <Suspense fallback={<div className="h-12 rounded-[var(--radius-md)] bg-[var(--surface-muted)]" />}>
              <CatalogSearch initialValue={params.busca ?? ""} key={params.busca ?? ""} />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-10 border-y border-[var(--border-soft)] bg-[var(--surface-page)]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
        {catalog.categoryNav.length > 0 ? (
          <nav aria-label="Categorias" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="flex min-w-max gap-2 py-1">
              <Link
                className={`flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition ${
                  !params.categoria
                    ? "border-[var(--brand-800)] bg-[var(--brand-800)] text-white shadow-[var(--shadow-xs)]"
                    : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
                href={catalogHref({ busca: params.busca })}
              >
                Todos
              </Link>
              {catalog.categoryNav.map((category) => (
                <Link
                  className={`flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold transition ${
                    params.categoria === category.slug
                      ? "border-[var(--brand-800)] bg-[var(--brand-800)] text-white shadow-[var(--shadow-xs)]"
                      : "border-[var(--border-default)] bg-white text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                  }`}
                  href={catalogHref({ categoria: category.slug, busca: params.busca })}
                  key={category.id}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-1 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-2xl">
              {sectionTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {productCount} {productCount === 1 ? "produto disponível" : "produtos disponíveis"}
            </p>
          </div>
          {hasSearch ? (
            <Link
              className="mt-2 text-sm font-semibold text-[var(--success)] underline-offset-4 hover:underline sm:mt-0"
              href={catalogHref({ categoria: params.categoria })}
            >
              Limpar busca
            </Link>
          ) : null}
        </div>
        {productCount === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white p-6 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
            <p className="text-lg font-semibold text-[var(--text-primary)]">Não encontramos produtos</p>
            <p className="mt-1">Tente buscar outro produto ou escolher outra categoria.</p>
            <Link
              className="mt-4 inline-flex min-h-10 items-center rounded-[var(--radius-sm)] bg-[var(--brand-900)] px-4 text-sm font-semibold text-white no-underline transition hover:bg-[var(--brand-800)]"
              href={catalogHref()}
            >
              Ver todos os produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {catalog.categories.map((category) => (
              <section key={category.id}>
                {!activeCategory ? (
                  <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">
                    {category.name}
                  </h3>
                ) : null}
                <div className="grid gap-3 min-[430px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {category.products.map((product, index) => {
                    const href = `/produto/${product.slug}${productSuffix}`;
                    return (
                      <PublicProductCard
                        categoryName={category.name}
                        key={product.id}
                        priority={index < 2}
                        product={product}
                        productHref={href}
                        sourceCode={sourceCode}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
      <footer className="border-t border-[var(--border-soft)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-[var(--text-muted)] sm:px-6 lg:px-8">
          <p className="font-semibold text-[var(--text-primary)]">{catalog.business.name}</p>
          <p className="mt-1">Produtos regionais selecionados.</p>
          <p className="mt-4">© 2026 DeliveryReg</p>
          <p className="mt-1 text-xs">Tecnologia por FlowtechAM</p>
        </div>
      </footer>
      <CatalogCartSummary sourceCode={sourceCode} />
    </main>
  );
}
