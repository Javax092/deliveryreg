"use client";

import { useMemo, useState } from "react";
import type { BaseUnit, MeasurementType } from "@prisma/client";

import { finalizePosSale } from "../../../app/(admin)/pdv/actions";
import { PdvSaleForm } from "@/components/admin/PdvSaleForm";
import { PublicProductImage } from "@/components/public/PublicProductImage";

type PaymentMethod = "PIX" | "DEBIT_CARD" | "CREDIT_CARD" | "CASH";

type PdvProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  measurementType: MeasurementType;
  baseUnit: BaseUnit;
  sellingIncrement: number;
  minimumOrderQuantity: number;

  category: {
    id: string;
    name: string;
  } | null;

  prices: Array<{
    priceCents: number;
    basisQuantity: number;
    basisUnit: BaseUnit;
  }>;

  availability: Array<{
    branchId: string;
  }>;
};

type PdvBranch = {
  id: string;
  name: string;
};

const paymentMethods: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  {
    value: "PIX",
    label: "Pix",
  },
  {
    value: "DEBIT_CARD",
    label: "Débito",
  },
  {
    value: "CREDIT_CARD",
    label: "Crédito",
  },
  {
    value: "CASH",
    label: "Dinheiro",
  },
];

function formatMoney(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function unitLabel(unit: BaseUnit) {
  const labels: Partial<Record<BaseUnit, string>> = {
    GRAM: "g",
    UNIT: "un.",
    PACKAGE: "pacote",
    MILLILITER: "ml",
    BOX: "caixa",
  };

  return labels[unit] ?? unit.toLowerCase();
}

function formatProductPrice(product: PdvProduct) {
  const price = product.prices[0];

  if (!price) {
    return "Preço não cadastrado";
  }

  if (price.basisUnit === "GRAM" && price.basisQuantity === 1000) {
    return `${formatMoney(price.priceCents)}/kg`;
  }

  if (price.basisUnit === "UNIT") {
    return `${formatMoney(price.priceCents)}/un.`;
  }

  if (price.basisUnit === "MILLILITER" && price.basisQuantity === 1000) {
    return `${formatMoney(price.priceCents)}/L`;
  }

  return `${formatMoney(price.priceCents)}/${unitLabel(price.basisUnit)}`;
}

function formatQuantity(quantity: number, unit: BaseUnit): string {
  if (unit === "GRAM") {
    if (quantity >= 1000) {
      const kilograms = quantity / 1000;

      return `${new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 3,
      }).format(kilograms)} kg`;
    }

    return `${quantity} g`;
  }

  if (unit === "MILLILITER") {
    if (quantity >= 1000) {
      const liters = quantity / 1000;

      return `${new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 3,
      }).format(liters)} L`;
    }

    return `${quantity} ml`;
  }

  return `${quantity} ${unitLabel(unit)}`;
}

export function PdvWorkspace({
  branches,
  products,
}: {
  branches: PdvBranch[];
  products: PdvProduct[];
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");

  const availableProducts = useMemo(() => {
    return products.filter((product) =>
      product.availability.some(
        (availability) => availability.branchId === branchId,
      ),
    );
  }, [products, branchId]);

  const categories = useMemo(() => {
    const names = availableProducts
      .map((product) => product.category?.name)
      .filter((name): name is string => Boolean(name));

    return [...new Set(names)];
  }, [availableProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return availableProducts.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        product.description
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch);

      const matchesCategory =
        category === "ALL" || product.category?.name === category;

      return matchesSearch && matchesCategory;
    });
  }, [availableProducts, search, category]);

  const selectedProduct =
    availableProducts.find((product) => product.id === selectedProductId) ??
    null;

  const activePrice = selectedProduct?.prices[0] ?? null;

  const parsedQuantity = Number(quantity);

  const amountCents =
    activePrice && Number.isFinite(parsedQuantity) && parsedQuantity > 0
      ? Math.round(
          (activePrice.priceCents * parsedQuantity) / activePrice.basisQuantity,
        )
      : null;

  function changeBranch(nextBranchId: string) {
    setBranchId(nextBranchId);
    setSelectedProductId(null);
    setQuantity("");
    setPaymentMethod("PIX");
    setCategory("ALL");
  }

  function selectProduct(productId: string) {
    setSelectedProductId(productId);
    setQuantity("");
    setPaymentMethod("PIX");
  }

  return (
    <div className="pdv-workspace">
      <section className="pdv-catalog">
        <div className="pdv-catalog-header">
          <div>
            <p className="pdv-eyebrow">Catálogo</p>
            <h2>Produtos</h2>
          </div>

          <label className="pdv-branch-field">
            <span>Unidade</span>

            <select
              value={branchId}
              onChange={(event) => changeBranch(event.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="pdv-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
          />
        </div>

        <div className="pdv-categories" aria-label="Categorias de produtos">
          <button
            className={category === "ALL" ? "is-active" : ""}
            type="button"
            onClick={() => setCategory("ALL")}
          >
            Todos
          </button>

          {categories.map((categoryName) => (
            <button
              className={category === categoryName ? "is-active" : ""}
              key={categoryName}
              type="button"
              onClick={() => setCategory(categoryName)}
            >
              {categoryName}
            </button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="pdv-products-grid">
            {filteredProducts.map((product) => {
              const selected = selectedProductId === product.id;

              return (
                <button
                  className={`pdv-product-card ${
                    selected ? "is-selected" : ""
                  }`}
                  key={product.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectProduct(product.id)}
                >
                  <div className="pdv-product-image">
                    <PublicProductImage
                      alt=""
                      className="h-full w-full"
                      name={product.name}
                      src={product.imageUrl}
                    />
                  </div>

                  <div className="pdv-product-info">
                    <span className="pdv-product-category">
                      {product.category?.name ?? "Produto"}
                    </span>

                    <strong>{product.name}</strong>

                    <span className="pdv-product-price">
                      {formatProductPrice(product)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="pdv-empty-state">
            <strong>Nenhum produto encontrado</strong>
            <span>Ajuste a busca ou escolha outra categoria.</span>
          </div>
        )}
      </section>

      <aside className="pdv-current-sale">
        <div className="pdv-current-sale-header">
          <div>
            <p className="pdv-eyebrow">Venda atual</p>
            <h2>Resumo</h2>
          </div>

          <span className="pdv-open-badge">Caixa aberto</span>
        </div>

        {selectedProduct ? (
          <PdvSaleForm action={finalizePosSale}>
            <input type="hidden" name="branchId" value={branchId} />

            <input type="hidden" name="productId" value={selectedProduct.id} />

            <div className="pdv-selected-product">
              <span className="pdv-product-category">
                {selectedProduct.category?.name ?? "Produto"}
              </span>

              <h3>{selectedProduct.name}</h3>

              <strong>{formatProductPrice(selectedProduct)}</strong>

              {selectedProduct.description ? (
                <p>{selectedProduct.description}</p>
              ) : null}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <label
                className="block text-sm font-semibold text-slate-800"
                htmlFor="quantity"
              >
                {selectedProduct.measurementType === "WEIGHT"
                  ? "Peso medido"
                  : "Quantidade"}
              </label>

              <div className="relative mt-2">
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  inputMode="numeric"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder={
                    selectedProduct.measurementType === "WEIGHT"
                      ? "Ex.: 527"
                      : "Ex.: 1"
                  }
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3 pr-20 text-base font-semibold text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-500">
                  {unitLabel(selectedProduct.baseUnit)}
                </span>
              </div>

              {selectedProduct.measurementType === "WEIGHT" ? (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Informe exatamente o peso indicado pela balança.
                </p>
              ) : null}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <p className="text-sm font-semibold text-slate-800">
                Forma de pagamento
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const selected = paymentMethod === method.value;

                  return (
                    <label
                      key={method.value}
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-sm font-semibold transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      <input
                        className="sr-only"
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={selected}
                        onChange={() => setPaymentMethod(method.value)}
                      />

                      {method.label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600">
                  {selectedProduct.measurementType === "WEIGHT"
                    ? "Peso"
                    : "Quantidade"}
                </span>

                <strong className="text-slate-950">
                  {Number.isFinite(parsedQuantity) && parsedQuantity > 0
                    ? formatQuantity(parsedQuantity, selectedProduct.baseUnit)
                    : "—"}
                </strong>
              </div>

              <div className="my-4 border-t border-slate-200" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Total
                  </span>

                  <span className="mt-1 block text-xs text-slate-500">
                    Valor desta venda
                  </span>
                </div>

                <strong className="text-2xl font-bold tracking-tight text-slate-950">
                  {amountCents === null ? "—" : formatMoney(amountCents)}
                </strong>
              </div>
            </div>
          </PdvSaleForm>
        ) : (
          <div className="pdv-sale-empty">
            <div className="pdv-sale-empty-icon" aria-hidden="true">
              +
            </div>

            <strong>Selecione um produto</strong>

            <p>Escolha um item do catálogo para iniciar a venda.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
