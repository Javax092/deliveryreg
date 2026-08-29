import { calculateProportionalAmountCents } from "@/modules/shared/money/money";
import {
  assertBaseQuantity,
  validateSellingQuantity,
} from "@/modules/shared/quantity/measurement";

export type PricedOrderItemInput = {
  productId: string;
  productName: string;
  measurementType: "WEIGHT" | "UNIT" | "PACKAGE" | "VOLUME" | "BOX";
  requestedQuantity: number;
  actualQuantity?: number;
  sellingIncrement: number;
  minimumOrderQuantity: number;
  priceCents: number;
  priceBasisQuantity: number;
  priceBasisUnit: "GRAM" | "UNIT" | "PACKAGE" | "MILLILITER" | "BOX";
};

export type PricedOrderItem = {
  productId: string;
  productNameSnapshot: string;
  measurementTypeSnapshot: PricedOrderItemInput["measurementType"];
  requestedQuantity: number;
  actualQuantity: number | null;
  priceCentsSnapshot: number;
  priceBasisQuantitySnapshot: number;
  priceBasisUnitSnapshot: PricedOrderItemInput["priceBasisUnit"];
  estimatedAmountCents: number;
  finalAmountCents: number | null;
};

/**
 * Precificação de pedido comercial.
 *
 * Usada principalmente no catálogo/site.
 *
 * Aqui são aplicadas as regras comerciais do produto:
 * - quantidade mínima;
 * - incremento de venda.
 *
 * Exemplo:
 * mínimo = 500 g
 * incremento = 50 g
 *
 * 500 g -> válido
 * 550 g -> válido
 * 527 g -> inválido
 */
export function priceOrderItem(input: PricedOrderItemInput): PricedOrderItem {
  const requestedQuantity = validateSellingQuantity({
    quantity: input.requestedQuantity,
    minimumQuantity: input.minimumOrderQuantity,
    increment: input.sellingIncrement,
  });

  const estimatedAmountCents = calculateProportionalAmountCents({
    priceCents: input.priceCents,
    basisQuantity: input.priceBasisQuantity,
    quantity: requestedQuantity,
  });

  const actualQuantity = input.actualQuantity ?? null;

  const finalAmountCents =
    actualQuantity === null ? null : estimatedAmountCents;
  /**
   * Precificação de pedido comercial.
   *
   * Usada principalmente no catálogo/site.
   *
   * A quantidade solicitada pelo cliente define o valor contratado.
   * Se um produto vendido por peso resultar em uma quantidade real
   * diferente após corte/pesagem, essa diferença é registrada em
   * actualQuantity para fins operacionais e de estoque, mas NÃO altera
   * o valor cobrado do cliente.
   *
   * Exemplo:
   * preço = R$ 42,00/kg
   * solicitado = 500 g
   * pesado = 518 g
   *
   * estimatedAmountCents = 2100
   * finalAmountCents = 2100
   *
   * Regras comerciais:
   * - quantidade mínima;
   * - incremento de venda.
   */
  return {
    productId: input.productId,
    productNameSnapshot: input.productName,
    measurementTypeSnapshot: input.measurementType,
    requestedQuantity,
    actualQuantity,
    priceCentsSnapshot: input.priceCents,
    priceBasisQuantitySnapshot: input.priceBasisQuantity,
    priceBasisUnitSnapshot: input.priceBasisUnit,
    estimatedAmountCents,
    finalAmountCents,
  };
}

export type PricedMeasuredOrderItemInput = {
  productId: string;
  productName: string;
  measurementType: PricedOrderItemInput["measurementType"];
  actualQuantity: number;
  priceCents: number;
  priceBasisQuantity: number;
  priceBasisUnit: PricedOrderItemInput["priceBasisUnit"];
};

/**
 * Precificação de quantidade efetivamente medida.
 *
 * Usada no PDV presencial.
 *
 * Não aplica mínimo ou incremento do catálogo porque a quantidade
 * representa aquilo que foi efetivamente pesado/medido no balcão.
 *
 * Exemplo:
 * 527 g -> válido
 * 684 g -> válido
 * 1037 g -> válido
 */
export function priceMeasuredOrderItem(
  input: PricedMeasuredOrderItemInput,
): PricedOrderItem {
  const actualQuantity = assertBaseQuantity(input.actualQuantity);

  const amountCents = calculateProportionalAmountCents({
    priceCents: input.priceCents,
    basisQuantity: input.priceBasisQuantity,
    quantity: actualQuantity,
  });

  return {
    productId: input.productId,
    productNameSnapshot: input.productName,
    measurementTypeSnapshot: input.measurementType,

    // No PDV a quantidade solicitada e a quantidade efetivamente
    // medida são a mesma quantidade.
    requestedQuantity: actualQuantity,
    actualQuantity,

    priceCentsSnapshot: input.priceCents,
    priceBasisQuantitySnapshot: input.priceBasisQuantity,
    priceBasisUnitSnapshot: input.priceBasisUnit,

    estimatedAmountCents: amountCents,
    finalAmountCents: amountCents,
  };
}
