"use server";

import { revalidatePath } from "next/cache";

import { assignDelivery, transitionAssignedDelivery } from "@/modules/delivery/operation";
import { actionError, actionOk, type ActionResult } from "@/modules/shared/actions/action-result";
import { getCurrentUserContext } from "@/modules/shared/auth/permissions";

export async function assignDeliveryAction(formData: FormData): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await assignDelivery({
      context,
      deliveryId: String(formData.get("deliveryId")),
      deliveryUserId: String(formData.get("deliveryUserId"))
    });
    revalidatePath("/entregas");
    return actionOk("Entrega atribuída.");
  } catch (error) {
    return actionError(error, "Não foi possível atribuir a entrega.", {
      AUTHORIZATION_ERROR: "Entregador inválido para esta filial ou sem permissão.",
      INVALID_STATE_TRANSITION: "Esta entrega não pode mais ser atribuída neste estado."
    });
  }
}

export async function markPickedUp(formData: FormData): Promise<ActionResult> {
  return transitionDelivery(formData, "PICKED_UP", "Pedido retirado para entrega.");
}

export async function markOnRoute(formData: FormData): Promise<ActionResult> {
  return transitionDelivery(formData, "ON_ROUTE", "Entrega em rota.");
}

export async function markDelivered(formData: FormData): Promise<ActionResult> {
  return transitionDelivery(formData, "DELIVERED", "Entrega concluída.");
}

export async function markFailed(formData: FormData): Promise<ActionResult> {
  return transitionDelivery(formData, "FAILED", "Falha registrada.");
}

async function transitionDelivery(
  formData: FormData,
  toStatus: "PICKED_UP" | "ON_ROUTE" | "DELIVERED" | "FAILED",
  successMessage: string
): Promise<ActionResult> {
  try {
    const context = await getCurrentUserContext();
    await transitionAssignedDelivery({
      context,
      deliveryId: String(formData.get("deliveryId")),
      toStatus,
      failureReason: toStatus === "FAILED" ? "Falha registrada pelo entregador" : undefined
    });
    revalidatePath("/entregas");
    return actionOk(successMessage);
  } catch (error) {
    return actionError(error, "Não foi possível atualizar a entrega.", {
      AUTHORIZATION_ERROR: "Você só pode atualizar entregas atribuídas a você.",
      INVALID_STATE_TRANSITION: "Esta entrega não pode avançar para este estado."
    });
  }
}
