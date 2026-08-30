"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
  buildCartItem,
  formatCartQuantity,
  getNextQuantity,
  readPublicCart,
  removePublicCart,
  writePublicCart,
  type PublicCartItem,
} from "@/modules/public-cart/cart";
import { formatBRL } from "@/modules/shared/money/money";

type Branch = {
  id: string;
  name: string;
};

export function CartCheckout({
  branches,
  sourceCode,
}: {
  branches: Branch[];
  sourceCode?: string;
}) {
  const router = useRouter();
  const submitLockRef = useRef(false);
  const idempotencyKeyRef = useRef<string | null>(null);
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [reference, setReference] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const effectiveSourceCode = sourceCode ?? items[0]?.sourceCode;
  const hasLockedBranch = Boolean(sourceCode && branches.length === 1);
  const hasWeightItem = items.some((item) => item.measurementType === "WEIGHT");

  useEffect(() => {
    function loadCart() {
      setItems(readPublicCart());
    }

    loadCart();
    window.addEventListener("storage", loadCart);
    window.addEventListener("deliveryreg-cart-updated", loadCart);

    return () => {
      window.removeEventListener("storage", loadCart);
      window.removeEventListener("deliveryreg-cart-updated", loadCart);
    };
  }, []);

  useEffect(() => {
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "cart_viewed",
        sourceCode: effectiveSourceCode,
      }),
    });
  }, [effectiveSourceCode]);

  const totalCents = useMemo(
    () => items.reduce((total, item) => total + item.estimatedAmountCents, 0),
    [items],
  );
  const catalogHref = sourceCode ? `/catalogo?origem=${encodeURIComponent(sourceCode)}` : "/catalogo";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setMessage(null);

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "checkout_started",
        sourceCode: effectiveSourceCode,
      }),
    });

    idempotencyKeyRef.current ??= window.crypto.randomUUID();

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        branchId,
        fulfillmentType,
        address:
          fulfillmentType === "DELIVERY"
            ? {
                street,
                number,
                neighborhood,
                reference,
              }
            : undefined,
        sourceCode: effectiveSourceCode,
        idempotencyKey: idempotencyKeyRef.current,
        customer: {
          name,
          whatsapp,
        },
        items: items.map((item) => ({
          productId: item.productId,
          requestedQuantity: item.requestedQuantity,
        })),
      }),
    });

    if (!response.ok) {
      setIsSubmitting(false);
      submitLockRef.current = false;
      setMessage(await getSafeErrorMessage(response));
      return;
    }

    const payload = (await response.json()) as { orderId: string };
    removePublicCart();
    router.push(`/pedido/${payload.orderId}`);
  }

  function updateItemQuantity(productId: string, direction: "decrease" | "increase") {
    const next = items.map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      return buildCartItem({
        ...item,
        requestedQuantity: getNextQuantity(item, direction),
      });
    });

    setItems(next);
    writePublicCart(next);
  }

  function removeItem(productId: string) {
    const next = items.filter((item) => item.productId !== productId);
    setItems(next);
    writePublicCart(next);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-5 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
        <p className="font-medium text-[var(--text-primary)]">Seu carrinho está vazio.</p>
        <Button className="mt-4" fullWidth href={catalogHref} size="lg">
          Voltar ao catálogo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Itens</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Seu carrinho</h2>
          </div>
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </div>

        <div className="mt-4 divide-y divide-[var(--border-soft)]">
          {items.map((item) => (
            <article className="py-4 first:pt-0 last:pb-0" key={item.productId}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-semibold text-[var(--text-primary)]">
                    {item.productName}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Quantidade: {formatCartQuantity(item)}
                  </p>
                </div>
                  <p className="shrink-0 text-right font-semibold text-[var(--text-primary)]">
                    Item {formatBRL(item.estimatedAmountCents)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="flex min-h-11 items-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-soft)]">
                  <button
                    aria-label={`Diminuir quantidade de ${item.productName}`}
                    className="grid h-11 w-11 place-items-center text-lg font-semibold text-[var(--text-primary)] disabled:text-[var(--text-subtle)]"
                    disabled={item.requestedQuantity <= item.minimumOrderQuantity}
                    onClick={() => updateItemQuantity(item.productId, "decrease")}
                    type="button"
                  >
                    -
                  </button>
                  <span className="min-w-20 px-2 text-center text-sm font-semibold text-[var(--text-primary)]">
                    {formatCartQuantity(item)}
                  </span>
                  <button
                    aria-label={`Aumentar quantidade de ${item.productName}`}
                    className="grid h-11 w-11 place-items-center text-lg font-semibold text-[var(--text-primary)]"
                    onClick={() => updateItemQuantity(item.productId, "increase")}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <button
                  className="min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  onClick={() => removeItem(item.productId)}
                  type="button"
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Resumo do pedido</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
            <span>Itens</span>
            <span>{items.length}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
            <span>Subtotal</span>
            <span>Incluído no total</span>
          </div>
          <div className="border-t border-[var(--border-soft)] pt-3">
            <div className="flex items-end justify-between gap-3">
              <span className="font-semibold text-[var(--text-primary)]">Total estimado</span>
              <span className="text-2xl font-semibold text-[var(--text-primary)]">
                {formatBRL(totalCents)}
              </span>
            </div>
          </div>
        </div>
        {hasWeightItem ? (
          <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--text-secondary)]">
            Valor estimado. O total final pode variar conforme o peso após o corte/pesagem.
          </p>
        ) : null}
      </section>

      <form className="space-y-5" onSubmit={submit}>
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <StepTitle number="1" title="Recebimento" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FulfillmentOption
              checked={fulfillmentType === "PICKUP"}
              label="Retirar na unidade"
              value="PICKUP"
              onChange={() => setFulfillmentType("PICKUP")}
            />
            <FulfillmentOption
              checked={fulfillmentType === "DELIVERY"}
              label="Receber por entrega"
              value="DELIVERY"
              onChange={() => setFulfillmentType("DELIVERY")}
            />
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <StepTitle number="2" title="Unidade" />
          <label className="mt-3 block text-sm font-medium text-[var(--text-primary)]" htmlFor="branch">
            Unidade responsável
          </label>
          <select
            className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-3 text-base text-[var(--text-primary)] disabled:bg-[var(--surface-soft)]"
            id="branch"
            disabled={hasLockedBranch}
            required
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {hasLockedBranch ? (
            <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">
              Unidade definida pelo QR Code.
            </p>
          ) : null}
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <StepTitle number="3" title="Seus dados" />
          <div className="mt-3 grid gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="name">
                Nome
              </label>
              <input
                className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base text-[var(--text-primary)]"
                id="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]" htmlFor="whatsapp">
                WhatsApp
              </label>
              <input
                autoComplete="tel"
                className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base text-[var(--text-primary)]"
                id="whatsapp"
                inputMode="tel"
                required
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
              />
            </div>
          </div>
        </section>

        {fulfillmentType === "DELIVERY" ? (
          <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
            <StepTitle number="4" title="Endereço" />
            <div className="mt-3 grid gap-3">
              <input
                aria-label="Rua"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base"
                placeholder="Rua"
                required
                value={street}
                onChange={(event) => setStreet(event.target.value)}
              />
              <input
                aria-label="Número"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base"
                placeholder="Número"
                required
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
              <input
                aria-label="Bairro"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base"
                placeholder="Bairro"
                required
                value={neighborhood}
                onChange={(event) => setNeighborhood(event.target.value)}
              />
              <input
                aria-label="Referência"
                className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 text-base"
                placeholder="Referência"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>
          </section>
        ) : null}

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <StepTitle number={fulfillmentType === "DELIVERY" ? "5" : "4"} title="Revisão" />
          <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
            <p>
              <strong className="text-[var(--text-primary)]">
                {fulfillmentType === "DELIVERY" ? "Entrega" : "Retirada"}
              </strong>
            </p>
            <p>
              Unidade:{" "}
              {branches.find((branch) => branch.id === branchId)?.name ?? "Selecione uma unidade"}
            </p>
            <p>Valor previsto: {formatBRL(totalCents)}</p>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-xs)]">
          <StepTitle number={fulfillmentType === "DELIVERY" ? "6" : "5"} title="Confirmar pedido" />
          <Button
            className="mt-3"
            disabled={isSubmitting || !branchId}
            fullWidth
            size="lg"
            type="submit"
          >
            <span className="sr-only">Fazer pedido. </span>
            {isSubmitting
              ? "Confirmando pedido..."
              : fulfillmentType === "DELIVERY"
                ? "Confirmar pedido para entrega"
                : "Confirmar pedido para retirada"}
          </Button>
          {message ? (
            <p
              className="mt-3 rounded-[var(--radius-md)] bg-[var(--danger-soft)] p-3 text-sm font-medium text-[var(--danger)]"
              role="alert"
            >
              {message}
            </p>
          ) : null}
        </section>
      </form>
    </div>
  );
}

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-soft)] text-xs font-semibold text-[var(--text-secondary)]">
        {number}
      </span>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
    </div>
  );
}

function FulfillmentOption({
  checked,
  label,
  value,
  onChange,
}: {
  checked: boolean;
  label: string;
  value: "PICKUP" | "DELIVERY";
  onChange: () => void;
}) {
  return (
    <label className="block">
      <input
        checked={checked}
        className="peer sr-only"
        name="fulfillmentType"
        type="radio"
        value={value}
        onChange={onChange}
      />
      <span className="flex min-h-14 cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white px-4 font-semibold text-[var(--text-primary)] peer-checked:border-[var(--success)] peer-checked:bg-[var(--success-soft)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand-600)]">
        {label}
      </span>
    </label>
  );
}

async function getSafeErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: unknown };

    if (typeof payload.message === "string" && payload.message.length <= 160) {
      return payload.message;
    }
  } catch {
    return "Não foi possível confirmar o pedido. Confira os dados e tente novamente.";
  }

  return "Não foi possível confirmar o pedido. Confira os dados e tente novamente.";
}
