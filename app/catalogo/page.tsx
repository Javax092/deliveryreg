/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { AnalyticsPing } from "@/components/public/AnalyticsPing";
import { CatalogCartSummary } from "@/components/public/CatalogCartSummary";
import { ProductImageFallback } from "@/components/public/ProductImageFallback";
import { ProductCardAddButton } from "@/components/public/ProductCardAddButton";
import { formatCatalogPrice, formatQuantity } from "@/modules/catalog/product-domain";
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--surface-page)] pb-32 text-[var(--text-primary)]">
      <AnalyticsPing eventType="catalog_viewed" sourceCode={sourceCode} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">
                Catálogo
              </p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight text-slate-950 sm:text-3xl">
                DeliveryReg Manaus
              </h1>
              <p className="mt-1 text-sm text-slate-600">Produtos frescos para você.</p>
            </div>
            {catalog.source?.branch?.name ? (
              <p className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
                Unidade {catalog.source.branch.name}
              </p>
            ) : null}
          </div>
          <form className="relative" role="search">
            {sourceCode ? <input name="origem" type="hidden" value={sourceCode} /> : null}
            {params.categoria ? (
              <input name="categoria" type="hidden" value={params.categoria} />
            ) : null}
            <label className="sr-only" htmlFor="busca">
              Buscar produto
            </label>
            <input
              className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-xs placeholder:text-slate-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
              defaultValue={params.busca}
              id="busca"
              name="busca"
              placeholder="Buscar produtos..."
            />
          </form>
        </div>
      </header>

      <section className="sticky top-0 z-10 border-b border-slate-200 bg-[#f6f8f6]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {catalog.categoryNav.length > 0 ? (
          <nav aria-label="Categorias" className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            <div className="flex min-w-max gap-2 pb-1">
              <Link
                className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
                  !params.categoria
                    ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950"
                }`}
                href={catalogHref({ busca: params.busca })}
              >
                Todos
              </Link>
              {catalog.categoryNav.map((category) => (
                <Link
                  className={`flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
                    params.categoria === category.slug
                      ? "border-emerald-800 bg-emerald-800 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950"
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
            <h2 className="text-xl font-semibold leading-tight text-slate-950 sm:text-2xl">
              {sectionTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {productCount} {productCount === 1 ? "produto disponível" : "produtos disponíveis"}
            </p>
          </div>
          {hasSearch ? (
            <Link
              className="mt-2 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline sm:mt-0"
              href={catalogHref({ categoria: params.categoria })}
            >
              Limpar busca
            </Link>
          ) : null}
        </div>
        {productCount === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-700 shadow-xs">
            {hasSearch ? (
              <>
                <p className="font-semibold text-slate-950">Nenhum produto encontrado.</p>
                <p className="mt-1">Tente outro termo.</p>
              </>
            ) : (
              "Nenhum produto disponível para esta unidade agora."
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {catalog.categories.map((category) => (
              <section key={category.id}>
                {!activeCategory ? (
                  <h3 className="mb-2 text-base font-semibold text-slate-950">{category.name}</h3>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {category.products.map((product) => {
                    const price = product.prices[0];
                    const href = `/produto/${product.slug}${productSuffix}`;
                    return (
                      <article
                        className="grid min-w-0 grid-cols-[104px_minmax(0,1fr)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs transition hover:border-slate-300 sm:flex sm:flex-col"
                        key={product.id}
                      >
                        {product.imageUrl ? (
                          <img
                            alt={product.name}
                            className="h-full min-h-full w-full bg-slate-100 object-cover sm:aspect-[16/10] sm:h-auto sm:min-h-0"
                            src={product.imageUrl}
                          />
                        ) : (
                          <ProductImageFallback
                            className="h-full min-h-full sm:aspect-[16/10] sm:h-auto sm:min-h-0"
                            name={product.name}
                          />
                        )}
                        <div className="flex flex-1 flex-col p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                            {category.name}
                          </p>
                          <Link className="mt-1 block rounded-sm" href={href}>
                            <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-semibold leading-tight text-slate-950">
                              {product.name}
                            </h3>
                          </Link>
                            {product.description ? (
                              <p className="mt-1 hidden line-clamp-1 text-xs leading-5 text-slate-600 sm:block">
                                {product.description}
                              </p>
                            ) : null}
                            <p className="mt-2 text-lg font-bold leading-none text-emerald-800">
                              {price
                                ? formatCatalogPrice({
                                    priceCents: price.priceCents,
                                    basisQuantity: price.basisQuantity,
                                    basisUnit: price.basisUnit
                                  })
                                : "Preço indisponível"}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500">
                              Min.{" "}
                              {formatQuantity({
                                measurementType: product.measurementType,
                                quantity: product.minimumOrderQuantity
                              })}
                            </p>
                            <div className="mt-auto grid gap-2 pt-3">
                              {price ? (
                                <ProductCardAddButton
                                  basisQuantity={price.basisQuantity}
                                  basisUnit={price.basisUnit}
                                  measurementType={product.measurementType}
                                  minimumQuantity={product.minimumOrderQuantity}
                                  priceCents={price.priceCents}
                                  productId={product.id}
                                  productName={product.name}
                                  sellingIncrement={product.sellingIncrement}
                                  sourceCode={sourceCode}
                                />
                              ) : (
                                <button
                                  className="min-h-10 w-full rounded-md bg-slate-200 px-3 text-sm font-semibold text-slate-600"
                                  disabled
                                  type="button"
                                >
                                  Indisponível
                                </button>
                              )}
                            </div>
                          </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
      <CatalogCartSummary sourceCode={sourceCode} />
    </main>
  );
}
