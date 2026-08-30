"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  formatQuantity,
  type ProductInput,
} from "@/modules/catalog/product-domain";
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
  measurementType: ProductInput["measurementType"];
  minimumQuantity: number;
  increment: number;
  priceCents: number;
  basisQuantity: number;
  basisUnit: ProductInput["priceBasisUnit"];
};

const weightPresets = [250, 500, 1000];

export function QuantityInterest(props: Props) {
  const presets =
    props.measurementType === "WEIGHT"
      ? weightPresets.filter(
          (preset) => preset >= props.minimumQuantity && preset % props.increment === 0,
        )
      : [props.minimumQuantity];
  const [quantity, setQuantity] = useState(presets[0] ?? props.minimumQuantity);
  const [message, setMessage] = useState<string | null>(null);

  const estimatedCents = useMemo(
    () =>
      buildCartItem({
        productId: props.productId,
        productName: props.productName,
        sourceCode: props.sourceCode,
        measurementType: props.measurementType,
        requestedQuantity: quantity,
        priceCents: props.priceCents,
        basisQuantity: props.basisQuantity,
        basisUnit: props.basisUnit,
        sellingIncrement: props.increment,
        minimumOrderQuantity: props.minimumQuantity,
      }).estimatedAmountCents,
    [props, quantity]
  );

  const isValidQuantity =
    Number.isInteger(quantity) &&
    quantity >= props.minimumQuantity &&
    quantity % props.increment === 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item = buildCartItem({
      productId: props.productId,
      productName: props.productName,
      sourceCode: props.sourceCode,
      measurementType: props.measurementType,
      requestedQuantity: quantity,
      priceCents: props.priceCents,
      basisQuantity: props.basisQuantity,
      basisUnit: props.basisUnit,
      sellingIncrement: props.increment,
      minimumOrderQuantity: props.minimumQuantity,
    });
    const current = readPublicCart();
    const next = current.filter((cartItem) => cartItem.productId !== props.productId);
    next.push(item);
    writePublicCart(next);

    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        eventType: "product_added",
        productId: props.productId,
        sourceCode: props.sourceCode
      })
    });

    setMessage("Produto adicionado ao carrinho.");
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-950">Escolha a quantidade</h2>
      {props.measurementType === "WEIGHT" ? (
        <p className="mt-1 text-sm text-slate-600">
          Valor estimado. O total final pode variar conforme o peso após o corte/pesagem.
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {presets.map((preset) => (
          <button
            className={`min-h-11 rounded-md border px-3 text-sm font-semibold ${
              quantity === preset
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-slate-300 bg-white text-slate-800"
            }`}
            key={preset}
            onClick={() => setQuantity(preset)}
            type="button"
          >
            {formatQuantity({
              measurementType: props.measurementType,
              quantity: preset,
            })}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-800" htmlFor="quantity">
        Quantidade personalizada
      </label>
      <input
        className="mt-1 h-12 w-full rounded-md border border-slate-300 px-3 text-base"
        id="quantity"
        inputMode="numeric"
        min={props.minimumQuantity}
        step={props.increment}
        type="number"
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value))}
      />
      {!isValidQuantity ? (
        <p className="mt-2 text-sm text-red-700">
          Informe uma quantidade a partir de {props.minimumQuantity} em múltiplos de{" "}
          {props.increment}.
        </p>
      ) : null}

      {props.measurementType === "WEIGHT" ? (
        <div className="mt-4 rounded-md bg-slate-100 p-3">
          <p className="text-sm text-slate-600">Estimativa</p>
          <p className="text-2xl font-semibold text-slate-950">{formatBRL(estimatedCents)}</p>
        </div>
      ) : null}

      <form className="mt-5 space-y-3" onSubmit={submit}>
        <button
          className="h-12 w-full rounded-md bg-emerald-700 px-4 font-semibold text-white disabled:bg-slate-400"
          disabled={!isValidQuantity}
          type="submit"
        >
          Adicionar ao carrinho
        </button>
        <a
          className="flex h-12 w-full items-center justify-center rounded-md border border-emerald-700 px-4 font-semibold text-emerald-800"
          href={props.sourceCode ? `/carrinho?origem=${encodeURIComponent(props.sourceCode)}` : "/carrinho"}
        >
          Ver carrinho
        </a>
        {message ? (
          <p className="text-sm font-medium text-slate-700" role="status">
            {message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
