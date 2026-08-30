import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalyticsPing } from "@/components/public/AnalyticsPing";
import { PublicProductImage } from "@/components/public/PublicProductImage";
import { QuantityInterest } from "@/components/public/QuantityInterest";
import { formatCatalogPrice, formatQuantity } from "@/modules/catalog/product-domain";
import { resolvePublicSourceCode } from "@/modules/leads/source";
import { getPublicProduct } from "@/modules/public-catalog/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    origem?: string;
    source?: string;
  }>;
};

export default async function ProdutoPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const sourceCode = resolvePublicSourceCode(query);
  const result = await getPublicProduct({
    slug,
    sourceCode
  });

  if (!result?.product) {
    notFound();
  }

  const product = result.product;
  const price = product.prices[0];

  if (!price) {
    notFound();
  }

  const sourceSuffix = sourceCode ? `?origem=${encodeURIComponent(sourceCode)}` : "";
  const catalogHref = `/catalogo${sourceSuffix}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <AnalyticsPing eventType="product_viewed" productId={product.id} sourceCode={sourceCode} />
      <section className="mx-auto max-w-5xl px-5 py-5">
        <Link className="text-sm font-semibold text-emerald-800" href={catalogHref}>
          Voltar ao catálogo
        </Link>
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid md:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div>
            <PublicProductImage
              alt={product.name}
              className="aspect-[4/3] h-full"
              name={product.name}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              src={product.imageUrl}
            />
          </div>
          <div className="p-5">
            <p className="text-sm font-semibold text-emerald-700">{result.business.name}</p>
            {result.source?.branch?.name ? (
              <p className="mt-1 text-sm text-slate-600">Unidade {result.source.branch.name}</p>
            ) : null}
            <p className="mt-4 text-sm font-semibold text-slate-500">
              {product.category?.name ?? "Produto"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-950">{product.name}</h1>
            {product.description ? (
              <p className="mt-3 text-slate-700">{product.description}</p>
            ) : null}
            <p className="mt-4 text-2xl font-semibold text-emerald-800">
              {formatCatalogPrice({
                priceCents: price.priceCents,
                basisQuantity: price.basisQuantity,
                basisUnit: price.basisUnit
              })}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Pedido mínimo:{" "}
              {formatQuantity({
                measurementType: product.measurementType,
                quantity: product.minimumOrderQuantity
              })}
            </p>
            {product.measurementType === "WEIGHT" ? (
              <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                Produto vendido por peso. A estimativa será ajustada após a pesagem real.
              </p>
            ) : null}
          </div>
        </div>

        <QuantityInterest
          basisQuantity={price.basisQuantity}
          basisUnit={price.basisUnit}
          increment={product.sellingIncrement}
          measurementType={product.measurementType}
          minimumQuantity={product.minimumOrderQuantity}
          priceCents={price.priceCents}
          productId={product.id}
          productName={product.name}
          sourceCode={sourceCode}
        />
      </section>
    </main>
  );
}
