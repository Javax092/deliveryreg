"use client";

import { useMemo, useState } from "react";

import { formatQuantity } from "@/modules/catalog/product-domain";
import {
  buildCartItem,
  readPublicCart,
  writePublicCart,
} from "@/modules/public-cart/cart";
import { formatBRL } from "@/modules/shared/money/money";

type Props = {
  productId: string;
  productName: string;
  sourceCode?: string;
  measurementType: "WEIGHT" | "UNIT" | "PACKAGE" | "VOLUME" | "BOX";
  minimumQuantity: number;
  sellingIncrement: number;
  priceCents: number;
  basisQuantity: number;
  basisUnit: "GRAM" | "UNIT" | "PACKAGE" | "MILLILITER" | "BOX";
};

export function ProductCardAddButton(props: Props) {
  const [quantity, setQuantity] = useState(props.minimumQuantity);
  const [message, setMessage] = useState<string | null>(null);
  const {
    basisQuantity,
    basisUnit,
    measurementType,
    minimumQuantity,
    priceCents,
    productId,
    productName,
    sellingIncrement,
    sourceCode,
  } = props;
  const estimatedAmountCents = useMemo(
    () =>
      buildCartItem({
        productId,
        productName,
        sourceCode,
        measurementType,
        requestedQuantity: quantity,
        priceCents,
        basisQuantity,
        basisUnit,
        sellingIncrement,
        minimumOrderQuantity: minimumQuantity,
      }).estimatedAmountCents,
    [
      basisQuantity,
      basisUnit,
      measurementType,
      minimumQuantity,
      priceCents,
      productId,
      productName,
      quantity,
      sellingIncrement,
      sourceCode,
    ],
  );

  function decreaseQuantity() {
    setQuantity((current) => Math.max(minimumQuantity, current - sellingIncrement));
    setMessage(null);
  }

  function increaseQuantity() {
    setQuantity((current) => current + sellingIncrement);
    setMessage(null);
  }

  async function addToCart() {
    const item = buildCartItem({
      productId,
      productName,
      sourceCode,
      measurementType,
      requestedQuantity: quantity,
      priceCents,
      basisQuantity,
      basisUnit,
      sellingIncrement,
      minimumOrderQuantity: minimumQuantity,
    });
    const current = readPublicCart();
    const next = current.filter((cartItem) => cartItem.productId !== productId);
    next.push(item);
    writePublicCart(next);

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "product_added",
        productId,
        sourceCode
      })
    });

    setMessage("Adicionado ao carrinho");
  }

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 items-center justify-between overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-soft)]">
        <button
          aria-label={`Diminuir quantidade de ${props.productName}`}
          className="grid h-9 w-10 shrink-0 place-items-center text-base font-semibold text-[var(--text-primary)] disabled:text-[var(--text-subtle)]"
          disabled={quantity <= props.minimumQuantity}
          onClick={decreaseQuantity}
          type="button"
        >
          -
        </button>
        <span className="min-w-0 px-2 text-center text-xs font-semibold text-[var(--text-primary)]">
          {formatQuantity({
            measurementType,
            quantity,
          })}
        </span>
        <button
          aria-label={`Aumentar quantidade de ${props.productName}`}
          className="grid h-9 w-10 shrink-0 place-items-center text-base font-semibold text-[var(--text-primary)]"
          onClick={increaseQuantity}
          type="button"
        >
          +
        </button>
      </div>
      <p className="text-xs font-semibold text-[var(--text-primary)]">
        {formatBRL(estimatedAmountCents)}{" "}
        <span className="font-medium text-[var(--text-muted)]">estimado</span>
      </p>
      <button
        className="min-h-10 w-full rounded-[var(--radius-sm)] bg-[var(--success)] px-3 text-sm font-semibold text-white transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--brand-600)] focus:ring-offset-2"
        onClick={addToCart}
        type="button"
      >
        Adicionar
      </button>
      {message ? (
        <p className="text-xs font-semibold text-[var(--success)]" role="status">
          <span aria-hidden="true">✓ </span>
          {message}
        </p>
      ) : null}
    </div>
  );
}
