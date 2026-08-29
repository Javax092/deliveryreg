"use server";

import { revalidatePath } from "next/cache";

import { completeOrder } from "@/modules/orders/complete-order";
import { confirmActualWeight, transitionOperationalOrder } from "@/modules/orders/operation";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function acceptOrder(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transitionOperationalOrder({
      context,
      orderId: String(formData.get("orderId")),
      toStatus: "ACCEPTED"
    });
    revalidatePath("/operacao");
    return actionOk("Pedido aceito.");
  } catch (error) {
    return actionError(error, "Não foi possível aceitar o pedido.", {
      CONFLICT: "Pedido mudou antes da sua ação. Atualize a Central e tente novamente.",
      INVALID_STATE_TRANSITION: "Este pedido não pode mais ser aceito neste estado."
    });
  }
}

export async function startPreparation(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transitionOperationalOrder({
      context,
      orderId: String(formData.get("orderId")),
      toStatus: "PREPARING"
    });
    revalidatePath("/operacao");
    return actionOk("Preparo iniciado.");
  } catch (error) {
    return actionError(error, "Não foi possível iniciar o preparo.", {
      CONFLICT: "Pedido mudou antes da sua ação. Atualize a Central e tente novamente.",
      INVALID_STATE_TRANSITION: "Este pedido não pode entrar em preparo neste estado."
    });
  }
}

export async function markReady(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transitionOperationalOrder({
      context,
      orderId: String(formData.get("orderId")),
      toStatus: "READY"
    });
    revalidatePath("/operacao");
    return actionOk("Pedido marcado como pronto.");
  } catch (error) {
    return actionError(error, "Não foi possível marcar como pronto.", {
      VALIDATION_ERROR: "Confirme primeiro o peso real dos itens vendidos por peso.",
      CONFLICT: "Pedido mudou antes da sua ação. Atualize a Central e tente novamente.",
      INVALID_STATE_TRANSITION: "Este pedido não pode ser marcado como pronto neste estado."
    });
  }
}

export async function cancelOrder(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transitionOperationalOrder({
      context,
      orderId: String(formData.get("orderId")),
      toStatus: "CANCELLED",
      reason: String(formData.get("reason") ?? "Cancelado pela operação")
    });
    revalidatePath("/operacao");
    return actionOk("Pedido cancelado.");
  } catch (error) {
    return actionError(error, "Não foi possível cancelar o pedido.", {
      INVALID_STATE_TRANSITION: "Este pedido não pode mais ser cancelado."
    });
  }
}

export async function completeOperationalOrder(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await completeOrder({
      context,
      orderId: String(formData.get("orderId")),
      idempotencyKey: String(formData.get("idempotencyKey"))
    });
    revalidatePath("/operacao");
    return actionOk("Pedido finalizado.");
  } catch (error) {
    return actionError(error, "Não foi possível concluir o pedido.", {
      CONFLICT: "Pedido já foi concluído ou mudou antes da sua ação.",
      INVENTORY_CONFLICT: "Não há estoque suficiente para concluir este pedido.",
      INVALID_STATE_TRANSITION: "Este pedido não pode ser concluído neste estado ou o caixa da unidade está fechado."
    });
  }
}

export async function confirmWeight(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await confirmActualWeight({
      context,
      orderItemId: String(formData.get("orderItemId")),
      actualQuantity: Number(formData.get("actualQuantity")),
      idempotencyKey: String(formData.get("idempotencyKey"))
    });
    revalidatePath("/operacao");
    return actionOk("Peso separado registrado para controle de estoque.");
  } catch (error) {
    return actionError(error, "Não foi possível confirmar o peso.", {
      CONFLICT: "Este item já teve o peso confirmado.",
      VALIDATION_ERROR: "Informe um peso real válido.",
      INVALID_STATE_TRANSITION: "Este pedido não aceita mais pesagem."
    });
  }
}
