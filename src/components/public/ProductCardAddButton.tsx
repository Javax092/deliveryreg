"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
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
  const messageTimeout = useRef<number | null>(null);
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

  useEffect(() => {
    return () => {
      if (messageTimeout.current) {
        window.clearTimeout(messageTimeout.current);
      }
    };
  }, []);

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

    setMessage("Adicionado");

    if (messageTimeout.current) {
      window.clearTimeout(messageTimeout.current);
    }

    messageTimeout.current = window.setTimeout(() => {
      setMessage(null);
    }, 1800);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 items-center justify-between overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-soft)] transition focus-within:border-[var(--brand-600)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
        <button
          aria-label={`Diminuir quantidade de ${props.productName}`}
          className="grid h-9 w-9 shrink-0 place-items-center text-[var(--text-primary)] transition hover:bg-white disabled:text-[var(--text-subtle)]"
          disabled={quantity <= props.minimumQuantity}
          onClick={decreaseQuantity}
          type="button"
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <span
          className="min-w-0 px-1 text-center text-xs font-semibold text-[var(--text-primary)]"
          key={quantity}
        >
          {formatQuantity({
            measurementType,
            quantity,
          })}
        </span>
        <button
          aria-label={`Aumentar quantidade de ${props.productName}`}
          className="grid h-9 w-9 shrink-0 place-items-center text-[var(--text-primary)] transition hover:bg-white"
          onClick={increaseQuantity}
          type="button"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {measurementType === "WEIGHT" || measurementType === "VOLUME" ? (
        <p className="text-sm font-bold leading-tight text-[var(--text-primary)]">
          {formatBRL(estimatedAmountCents)}{" "}
          <span className="font-medium text-[var(--text-muted)]">estimado</span>
        </p>
      ) : null}
      <Button
        className="min-h-10 rounded-[var(--radius-sm)] text-sm"
        fullWidth
        onClick={addToCart}
        type="button"
      >
        {message ? (
          <>
            <Check aria-hidden="true" className="h-4 w-4" />
            {message}
          </>
        ) : (
          "Adicionar"
        )}
      </Button>
      {message ? (
        <span className="sr-only" role="status">
          Produto adicionado ao carrinho
        </span>
      ) : null}
    </div>
  );
}
