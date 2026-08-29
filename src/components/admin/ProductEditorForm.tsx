"use client";

import { useMemo, useState } from "react";

import { AdminActionForm } from "@/components/admin/AdminActionForm";
import { ProductImageFallback } from "@/components/public/ProductImageFallback";
import type { ActionResult } from "@/modules/shared/actions/action-result";

const fieldClass =
  "mt-1 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 shadow-xs placeholder:text-slate-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15";

const textareaClass =
  "mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-xs placeholder:text-slate-500 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15";

type Branch = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
};

type ProductForForm = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  imageUrl: string | null;
  measurementType: "WEIGHT" | "UNIT" | "PACKAGE" | "VOLUME" | "BOX";
  minimumOrderQuantity: number;
  sellingIncrement: number;
  isActive: boolean;
  prices: Array<{
    priceCents: number;
    basisQuantity: number;
    basisUnit: "GRAM" | "UNIT" | "PACKAGE" | "MILLILITER" | "BOX";
    endsAt: string | null;
  }>;
  availability: Array<{
    branchId: string;
    isAvailable: boolean;
  }>;
};

export function ProductEditorForm({
  action,
  branches,
  categories,
  product
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  branches: Branch[];
  categories: Category[];
  product?: ProductForForm | null;
}) {
  const currentPrice = product?.prices.find((price) => price.endsAt === null) ?? product?.prices[0];
  const availableBranchIds = new Set(
    product?.availability
      .filter((availability) => availability.isAvailable)
      .map((availability) => availability.branchId) ?? branches.map((branch) => branch.id)
  );
  const [measurementType, setMeasurementType] = useState(product?.measurementType ?? "UNIT");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const selectedDefaults = useMemo(() => defaultsForMeasurement(measurementType), [measurementType]);

  return (
    <AdminActionForm
      action={action}
      className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-xs"
      pendingLabel="Salvando..."
      submitLabel={product ? "Salvar produto" : "Cadastrar produto"}
    >
      {product ? <input name="productId" type="hidden" value={product.id} /> : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="name">
              Nome
            </label>
            <input
              className={fieldClass}
              defaultValue={product?.name}
              id="name"
              name="name"
              required
            />
            {product ? (
              <p className="mt-1 text-xs text-slate-500">
                Alterar o nome não muda o link público já gerado.
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="description">
              Descrição
            </label>
            <textarea
              className={textareaClass}
              defaultValue={product?.description ?? ""}
              id="description"
              name="description"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="categoryId">
                Categoria
              </label>
              <select
                className={fieldClass}
                defaultValue={product?.categoryId ?? categories[0]?.id}
                id="categoryId"
                name="categoryId"
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="price">
                Preço
              </label>
              <input
                className={fieldClass}
                defaultValue={currentPrice ? formatPriceInput(currentPrice.priceCents) : ""}
                id="price"
                inputMode="decimal"
                name="price"
                placeholder="42,90"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Base: {selectedDefaults.priceLabel}
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Como é vendido?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {measurementOptions.map((option) => (
                <label
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    measurementType === option.value
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  key={option.value}
                >
                  <input
                    className="mr-2"
                    checked={measurementType === option.value}
                    name="measurementType"
                    type="radio"
                    value={option.value}
                    onChange={() => setMeasurementType(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="minimumOrderQuantity">
                Quantidade mínima ({selectedDefaults.quantityLabel})
              </label>
              <input
                className={fieldClass}
                defaultValue={product?.minimumOrderQuantity ?? selectedDefaults.minimum}
                id="minimumOrderQuantity"
                min="1"
                name="minimumOrderQuantity"
                required
                type="number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800" htmlFor="sellingIncrement">
                Incremento ({selectedDefaults.quantityLabel})
              </label>
              <input
                className={fieldClass}
                defaultValue={product?.sellingIncrement ?? selectedDefaults.increment}
                id="sellingIncrement"
                min="1"
                name="sellingIncrement"
                required
                type="number"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-800">Disponível em</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {branches.map((branch) => (
                <label
                  className="flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-800"
                  key={branch.id}
                >
                  <input
                    defaultChecked={availableBranchIds.has(branch.id)}
                    name="availableBranchIds"
                    type="checkbox"
                    value={branch.id}
                  />
                  {branch.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input defaultChecked={product?.isActive ?? true} name="isActive" type="checkbox" />
            Produto ativo no catálogo
          </label>
        </div>

        <aside className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-800" htmlFor="imageUrl">
              URL da imagem
            </label>
            <input
              className={fieldClass}
              id="imageUrl"
              name="imageUrl"
              placeholder="https://..."
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
            />
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Preview do produto" className="aspect-[4/3] w-full object-cover" src={imageUrl} />
            ) : (
              <ProductImageFallback name={product?.name ?? "Produto"} />
            )}
          </div>
          <p className="text-sm text-slate-600">
            Upload de imagem não está configurado. Use uma URL pública ou mantenha o fallback.
          </p>
        </aside>
      </div>
    </AdminActionForm>
  );
}

const measurementOptions: Array<{
  value: ProductForForm["measurementType"];
  label: string;
}> = [
  { value: "UNIT", label: "Unidade" },
  { value: "WEIGHT", label: "Peso" },
  { value: "PACKAGE", label: "Pacote" },
  { value: "VOLUME", label: "Volume" },
  { value: "BOX", label: "Caixa" }
];

function defaultsForMeasurement(measurementType: ProductForForm["measurementType"]) {
  const defaults = {
    UNIT: { priceLabel: "R$/un.", quantityLabel: "un.", minimum: 1, increment: 1 },
    WEIGHT: { priceLabel: "R$/kg", quantityLabel: "g", minimum: 250, increment: 50 },
    PACKAGE: { priceLabel: "R$/pacote", quantityLabel: "pacote", minimum: 1, increment: 1 },
    VOLUME: { priceLabel: "R$/l", quantityLabel: "ml", minimum: 1000, increment: 100 },
    BOX: { priceLabel: "R$/caixa", quantityLabel: "caixa", minimum: 1, increment: 1 }
  };

  return defaults[measurementType];
}

function formatPriceInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}
