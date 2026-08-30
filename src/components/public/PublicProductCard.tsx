import Link from "next/link";

import { ProductCardAddButton } from "@/components/public/ProductCardAddButton";
import { PublicProductImage } from "@/components/public/PublicProductImage";
import { formatCatalogPrice, formatQuantity } from "@/modules/catalog/product-domain";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  measurementType: "WEIGHT" | "UNIT" | "PACKAGE" | "VOLUME" | "BOX";
  minimumOrderQuantity: number;
  sellingIncrement: number;
  prices: Array<{
    priceCents: number;
    basisQuantity: number;
    basisUnit: "GRAM" | "UNIT" | "PACKAGE" | "MILLILITER" | "BOX";
  }>;
};

type Props = {
  categoryName: string;
  product: Product;
  productHref: string;
  priority?: boolean;
  sourceCode?: string;
};

export function PublicProductCard({
  categoryName,
  product,
  productHref,
  priority = false,
  sourceCode,
}: Props) {
  const price = product.prices[0];

  return (
    <article className="group grid min-w-0 grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white shadow-[var(--shadow-xs)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] motion-reduce:hover:translate-y-0 min-[430px]:flex min-[430px]:flex-col">
      <Link
        aria-label="Ver detalhes"
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-600)] focus-visible:ring-offset-2"
        href={productHref}
      >
        <PublicProductImage
          alt={product.name}
          className="h-full min-h-[156px] min-[430px]:aspect-[4/3] min-[430px]:h-auto min-[430px]:min-h-0 sm:aspect-[5/4]"
          name={product.name}
          priority={priority}
          src={product.imageUrl}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {categoryName}
        </p>
        <Link className="mt-1 block rounded-sm" href={productHref}>
          <h3 className="line-clamp-2 text-base font-semibold leading-tight text-[var(--text-primary)]">
            {product.name}
          </h3>
        </Link>
        {product.description ? (
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--text-secondary)]">
            {product.description}
          </p>
        ) : null}
        <div className="mt-2">
          <p className="text-[15px] font-bold leading-tight text-[var(--success)]">
            {price
              ? formatCatalogPrice({
                  priceCents: price.priceCents,
                  basisQuantity: price.basisQuantity,
                  basisUnit: price.basisUnit,
                })
              : "Preço indisponível"}
          </p>
          <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
            Mín.{" "}
            {formatQuantity({
              measurementType: product.measurementType,
              quantity: product.minimumOrderQuantity,
            })}
          </p>
        </div>
        <div className="mt-auto pt-2.5">
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
              className="min-h-10 w-full rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-3 text-sm font-semibold text-[var(--text-muted)]"
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
}
